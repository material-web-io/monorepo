import { twMerge } from '@material-web/react'
import { createContext, use, useLayoutEffect, useRef, useState, type ReactNode } from 'react'

/** Which side of the picture a slot's number is shown on. */
export type SlotSide = 'top' | 'bottom' | 'start' | 'end'

type Box = { left: number; top: number; right: number; bottom: number }

/** A slotted element as the picture marks it: its outline, and its number with a line to it. */
type Mark = {
  number: number
  box: Box
  color: string
  marker: { left: number; top: number }
  line: { x1: number; y1: number; x2: number; y2: number }
}

// The room between two numbers in a row or a column, how far an outline stands off its element,
// and how far into a wide or tall element a line points.
const gap = 8
const standoff = 3
const reachIn = 48

// The slots a picture numbers, in the order of their numbers.
const SlotOrder = createContext<string[]>([])

/* An element's outline: `standoff` around it, but on a side where another marked element is near,
 * only to halfway, less the stroke, so the two outlines stay apart: inside the element where they
 * touch, as two lines of text do. */
function outlineOf(box: Box, others: Box[]): Box {
  const room = (gaps: number[]) => Math.min(standoff, ...gaps.map((space) => space / 2 - 1))
  const beside = others.filter((other) => other.top < box.bottom && other.bottom > box.top)
  const over = others.filter((other) => other.left < box.right && other.right > box.left)
  const before = beside.filter((other) => other.right <= box.left + 0.5)
  const after = beside.filter((other) => other.left >= box.right - 0.5)
  const above = over.filter((other) => other.bottom <= box.top + 0.5)
  const under = over.filter((other) => other.top >= box.bottom - 0.5)
  return {
    left: box.left - room(before.map((other) => box.left - other.right)),
    right: box.right + room(after.map((other) => other.left - box.right)),
    top: box.top - room(above.map((other) => box.top - other.bottom)),
    bottom: box.bottom + room(under.map((other) => other.top - box.bottom)),
  }
}

/* Places the numbers along one side, each as near its anchor as the numbers before and after it
 * leave room for, within `min` and `max`. */
function spread<T extends { anchor: number; at: number }>(
  row: T[],
  size: number,
  min: number,
  max: number,
) {
  row.sort((a, b) => a.anchor - b.anchor)
  let end = min - gap
  for (const mark of row) {
    mark.at = Math.max(mark.anchor - size / 2, end + gap)
    end = mark.at + size
  }
  let start = max + gap
  for (const mark of [...row].reverse()) {
    mark.at = Math.min(mark.at, start - gap - size)
    start = mark.at
  }
}

// Elements drawn whole, whatever they hold.
const replaced = new Set(['img', 'svg', 'video', 'canvas', 'input', 'textarea', 'select', 'iframe'])

const isClear = (color: string) => color === 'transparent' || /[,/]\s*0\)$/.test(color)

const union = (boxes: Box[]): Box | null =>
  boxes.length === 0
    ? null
    : {
        left: Math.min(...boxes.map((box) => box.left)),
        top: Math.min(...boxes.map((box) => box.top)),
        right: Math.max(...boxes.map((box) => box.right)),
        bottom: Math.max(...boxes.map((box) => box.bottom)),
      }

const intersect = (box: Box, clip: Box): Box | null => {
  const left = Math.max(box.left, clip.left)
  const top = Math.max(box.top, clip.top)
  const right = Math.min(box.right, clip.right)
  const bottom = Math.min(box.bottom, clip.bottom)
  return right > left && bottom > top ? { left, top, right, bottom } : null
}

/* Whether an element paints a box of its own: a background, a border or a shadow. */
function paints(style: CSSStyleDeclaration) {
  return (
    !isClear(style.backgroundColor) ||
    style.backgroundImage !== 'none' ||
    style.boxShadow !== 'none' ||
    (['Top', 'Right', 'Bottom', 'Left'] as const).some(
      (side) =>
        parseFloat(style[`border${side}Width`]) > 0 && !isClear(style[`border${side}Color`]),
    )
  )
}

/* What an element draws, on the page: its whole box where it paints one or is an image, and its
 * text and what its children draw, so not the padding or the room a layout stretches it to. A
 * text's line is cut to the element holding it, as an icon's taller line is to its square. */
function drawnBox(element: Element): Box | null {
  const style = getComputedStyle(element)
  if (style.display === 'none' || style.opacity === '0') return null
  // An element of display: contents has no box to paint or to cut to.
  const rect = style.display === 'contents' ? null : element.getBoundingClientRect()
  const isVisible = style.visibility === 'visible'
  const boxes: Box[] = []
  if (
    isVisible &&
    rect &&
    rect.width > 0 &&
    rect.height > 0 &&
    (replaced.has(element.localName) || paints(style))
  ) {
    boxes.push(rect)
  }
  if (!replaced.has(element.localName)) {
    for (const node of element.childNodes) {
      if (node instanceof Element) {
        const box = drawnBox(node)
        if (box) boxes.push(box)
      } else if (isVisible && node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
        const range = document.createRange()
        range.selectNodeContents(node)
        const line = range.getBoundingClientRect()
        const box = rect ? intersect(line, rect) : line
        if (box) boxes.push(box)
      }
    }
  }
  const box = union(boxes)
  return box && rect && style.overflow !== 'visible' ? intersect(box, rect) : box
}

/* Whether an element is drawn: it has a size, is not hidden, and nothing up to the picture is
 * see-through. A page fading in around the picture is not asked: it starts see-through, and
 * nothing would measure the picture again once it is in. */
function isShown(element: HTMLElement, box: DOMRect, content: HTMLElement) {
  if (box.width <= 0 || box.height <= 0) return false
  if (getComputedStyle(element).visibility !== 'visible') return false
  for (let node = element; node !== content; node = node.parentElement!) {
    if (getComputedStyle(node).opacity === '0') return false
  }
  return true
}

/**
 * A picture of a component's slots, as Material's anatomy diagrams are drawn: one `SlotCanvas` or
 * several in a row on a container, each slotted part numbered by its place in `slots`, and with
 * `showLegend`, the numbers' slots listed under the container.
 */
export function SlotPicture({
  slots,
  showLegend = false,
  children,
}: {
  slots: string[]
  showLegend?: boolean
  children: ReactNode
}) {
  return (
    <div className="docs-slot-picture">
      <div className="docs-slot-picture-frame">
        <div aria-hidden className="docs-slot-picture-row">
          <SlotOrder value={slots}>{children}</SlotOrder>
        </div>
      </div>
      {showLegend && (
        <ol className="docs-slot-legend">
          {slots.map((name, index) => (
            <li key={name} className="docs-slot-legend-item">
              <span aria-hidden className="docs-slot-key">
                {index + 1}
              </span>
              {name}
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

/**
 * A component drawn inert, with each child it holds in one of its picture's slots outlined around
 * what it draws, in the text color around it, and numbered: the number on the side nearer the child, above or below, unless
 * `sides` says, with a line to it. A slotted child inside another, such as an icon in a slotted
 * button, is left unmarked. The marks follow the children's boxes as the page lays them out.
 */
export function SlotCanvas({
  sides,
  children,
}: {
  sides?: Partial<Record<string, SlotSide>>
  children: ReactNode
}) {
  const slots = use(SlotOrder)
  const canvasRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const sizerRef = useRef<HTMLSpanElement>(null)
  const [marks, setMarks] = useState<Mark[]>([])
  const hasSides = Object.values(sides ?? {}).some((side) => side === 'start' || side === 'end')

  useLayoutEffect(() => {
    const canvas = canvasRef.current!
    const content = contentRef.current!
    const sizer = sizerRef.current!
    let last = ''
    const measure = () => {
      const origin = canvas.getBoundingClientRect()
      const at = (rect: Box): Box => ({
        left: rect.left - origin.left,
        top: rect.top - origin.top,
        right: rect.right - origin.left,
        bottom: rect.bottom - origin.top,
      })
      const frame = at(content.getBoundingClientRect())
      const middle = (frame.top + frame.bottom) / 2
      const isRtl = getComputedStyle(canvas).direction === 'rtl'
      // Each side on the page: start and end by the direction the picture is written in.
      const edges = {
        top: 'top',
        bottom: 'bottom',
        start: isRtl ? 'right' : 'left',
        end: isRtl ? 'left' : 'right',
      } as const
      const width = sizer.offsetWidth
      const height = sizer.offsetHeight

      const marked = [...content.querySelectorAll<HTMLElement>('[slot]')].flatMap((element) => {
        if (!slots.includes(element.slot)) return []
        for (let parent = element.parentElement; parent && parent !== content;) {
          if (slots.includes(parent.slot)) return []
          parent = parent.parentElement
        }
        const rect = element.getBoundingClientRect()
        const drawn = isShown(element, rect, content) && drawnBox(element)
        if (!drawn) return []
        const box = at(drawn)
        const side =
          sides?.[element.slot] ?? ((box.top + box.bottom) / 2 <= middle ? 'top' : 'bottom')
        const edge = edges[side]
        // Where its number points: its middle, or near its start when it is wide or tall, as a
        // line of text is, clear of what may sit at the far end of its row.
        const isRow = edge === 'top' || edge === 'bottom'
        const anchor = isRow
          ? isRtl
            ? Math.max((box.left + box.right) / 2, box.right - reachIn)
            : Math.min((box.left + box.right) / 2, box.left + reachIn)
          : (box.top + box.bottom) / 2
        const number = slots.indexOf(element.slot) + 1
        // The outline is drawn on what holds the element, so in the color of that one's text.
        const color = getComputedStyle(element.parentElement ?? element).color
        return [{ number, box, edge, anchor, at: 0, color }]
      })

      for (const edge of ['top', 'bottom'] as const) {
        spread(
          marked.filter((mark) => mark.edge === edge),
          width,
          0,
          canvas.offsetWidth,
        )
      }
      for (const edge of ['left', 'right'] as const) {
        spread(
          marked.filter((mark) => mark.edge === edge),
          height,
          0,
          canvas.offsetHeight,
        )
      }

      const boxes = marked.map((mark) => mark.box)
      const next: Mark[] = marked.map(({ number, box: element, edge, at: place, color }) => {
        const box = outlineOf(
          element,
          boxes.filter((other) => other !== element),
        )
        const reachX = Math.min(6, (box.right - box.left) / 2)
        const reachY = Math.min(6, (box.bottom - box.top) / 2)
        const clampX = (x: number) => Math.min(Math.max(x, box.left + reachX), box.right - reachX)
        const clampY = (y: number) => Math.min(Math.max(y, box.top + reachY), box.bottom - reachY)
        if (edge === 'top' || edge === 'bottom') {
          const top =
            edge === 'top'
              ? (frame.top - height) / 2
              : frame.bottom + (canvas.offsetHeight - frame.bottom - height) / 2
          const x = place + width / 2
          return {
            number,
            box,
            color,
            marker: { left: place, top },
            line: {
              x1: x,
              y1: edge === 'top' ? top + height : top,
              x2: clampX(x),
              y2: edge === 'top' ? box.top : box.bottom,
            },
          }
        }
        const left =
          edge === 'left'
            ? (frame.left - width) / 2
            : frame.right + (canvas.offsetWidth - frame.right - width) / 2
        const y = place + height / 2
        return {
          number,
          box,
          color,
          marker: { left, top: place },
          line: {
            x1: edge === 'left' ? left + width : left,
            y1: y,
            x2: edge === 'left' ? box.left : box.right,
            y2: clampY(y),
          },
        }
      })
      const key = JSON.stringify(next)
      if (key === last) return
      last = key
      setMarks(next)
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(canvas)
    observer.observe(content)
    content.addEventListener('transitionend', measure)
    content.addEventListener('animationend', measure)
    let isMounted = true
    void document.fonts.ready.then(() => isMounted && measure())
    return () => {
      isMounted = false
      observer.disconnect()
      content.removeEventListener('transitionend', measure)
      content.removeEventListener('animationend', measure)
    }
  }, [slots, sides])

  return (
    <div
      ref={canvasRef}
      className={twMerge('docs-slot-canvas', hasSides ? 'px-space-700' : 'px-space-300')}
    >
      <div ref={contentRef} inert className="isolate">
        {children}
      </div>
      <svg className="docs-slot-lines">
        {marks.map(({ box, color, line }, index) => (
          <g key={index}>
            <rect
              x={box.left}
              y={box.top}
              width={box.right - box.left}
              height={box.bottom - box.top}
              className="docs-slot-outline"
              style={{ stroke: color }}
            />
            <line {...line} className="docs-slot-line" />
          </g>
        ))}
      </svg>
      {marks.map(({ number, marker }, index) => (
        <span
          key={index}
          className="docs-slot-number docs-slot-marker"
          style={{ left: marker.left, top: marker.top }}
        >
          {number}
        </span>
      ))}
      <span ref={sizerRef} className="docs-slot-number docs-slot-marker invisible">
        0
      </span>
    </div>
  )
}
