/* A port of the part of androidx.graphics.shapes that Compose's circular wavy progress indicator
 * draws with: rounded polygons (a circle and a star of the same vertex count), their cubics, and
 * the morph between them, so that the drawing here is the one on Android. Units are the
 * polygon's own; the caller scales the result. */
import type { Point } from './geometry'

const distanceEpsilon = 1e-4
const angleEpsilon = 1e-6

/** A cubic curve: its two anchors with a control point after the first and before the second. */
export type Cubic = readonly [
  a0x: number,
  a0y: number,
  c0x: number,
  c0y: number,
  c1x: number,
  c1y: number,
  a1x: number,
  a1y: number,
]

const distance = (x: number, y: number) => Math.hypot(x, y)
const lerp = (a: number, b: number, t: number) => (1 - t) * a + t * b
const positiveModulo = (n: number, m: number) => ((n % m) + m) % m
const direction = (x: number, y: number): Point => {
  const d = distance(x, y)
  return [x / d, y / d]
}
const rotate90 = ([x, y]: Point): Point => [-y, x]
const dot = (a: Point, b: Point) => a[0] * b[0] + a[1] * b[1]
const add = (a: Point, b: Point): Point => [a[0] + b[0], a[1] + b[1]]
const sub = (a: Point, b: Point): Point => [a[0] - b[0], a[1] - b[1]]
const scale = (a: Point, k: number): Point => [a[0] * k, a[1] * k]

export function pointOnCurve(c: Cubic, t: number): Point {
  const u = 1 - t
  return [
    c[0] * u * u * u + c[2] * 3 * t * u * u + c[4] * 3 * t * t * u + c[6] * t * t * t,
    c[1] * u * u * u + c[3] * 3 * t * u * u + c[5] * 3 * t * t * u + c[7] * t * t * t,
  ]
}

/** The curve's first and second derivatives in its parameter. */
export function derivatives(c: Cubic, t: number): [first: Point, second: Point] {
  const u = 1 - t
  const d = (i: number) =>
    3 *
    (u * u * (c[i + 2]! - c[i]!) +
      2 * u * t * (c[i + 4]! - c[i + 2]!) +
      t * t * (c[i + 6]! - c[i + 4]!))
  const dd = (i: number) =>
    6 * (u * (c[i + 4]! - 2 * c[i + 2]! + c[i]!) + t * (c[i + 6]! - 2 * c[i + 4]! + c[i + 2]!))
  return [
    [d(0), d(1)],
    [dd(0), dd(1)],
  ]
}

const zeroLength = (c: Cubic) =>
  Math.abs(c[0] - c[6]) < distanceEpsilon && Math.abs(c[1] - c[7]) < distanceEpsilon

export function split(c: Cubic, t: number): [Cubic, Cubic] {
  const u = 1 - t
  const [px, py] = pointOnCurve(c, t)
  return [
    [
      c[0],
      c[1],
      c[0] * u + c[2] * t,
      c[1] * u + c[3] * t,
      c[0] * u * u + c[2] * 2 * u * t + c[4] * t * t,
      c[1] * u * u + c[3] * 2 * u * t + c[5] * t * t,
      px,
      py,
    ],
    [
      px,
      py,
      c[2] * u * u + c[4] * 2 * u * t + c[6] * t * t,
      c[3] * u * u + c[5] * 2 * u * t + c[7] * t * t,
      c[4] * u + c[6] * t,
      c[5] * u + c[7] * t,
      c[6],
      c[7],
    ],
  ]
}

const reverse = (c: Cubic): Cubic => [c[6], c[7], c[4], c[5], c[2], c[3], c[0], c[1]]

const straightLine = (x0: number, y0: number, x1: number, y1: number): Cubic => [
  x0,
  y0,
  lerp(x0, x1, 1 / 3),
  lerp(y0, y1, 1 / 3),
  lerp(x0, x1, 2 / 3),
  lerp(y0, y1, 2 / 3),
  x1,
  y1,
]

function circularArc(
  cx: number,
  cy: number,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
): Cubic {
  const p0d = direction(x0 - cx, y0 - cy)
  const p1d = direction(x1 - cx, y1 - cy)
  const r0 = rotate90(p0d)
  const r1 = rotate90(p1d)
  const clockwise = dot(r0, [x1 - cx, y1 - cy]) >= 0
  const cosa = dot(p0d, p1d)
  if (cosa > 0.999) return straightLine(x0, y0, x1, y1)
  const k =
    ((distance(x0 - cx, y0 - cy) * 4) / 3) *
    ((Math.sqrt(2 * (1 - cosa)) - Math.sqrt(1 - cosa * cosa)) / (1 - cosa)) *
    (clockwise ? 1 : -1)
  return [x0, y0, x0 + r0[0] * k, y0 + r0[1] * k, x1 - r1[0] * k, y1 - r1[1] * k, x1, y1]
}

export type Transform = (x: number, y: number) => Point

export const transformCubic = (c: Cubic, f: Transform): Cubic => {
  const [a0x, a0y] = f(c[0], c[1])
  const [c0x, c0y] = f(c[2], c[3])
  const [c1x, c1y] = f(c[4], c[5])
  const [a1x, a1y] = f(c[6], c[7])
  return [a0x, a0y, c0x, c0y, c1x, c1y, a1x, a1y]
}

export type CornerRounding = { radius: number; smoothing: number }
export const unrounded: CornerRounding = { radius: 0, smoothing: 0 }

export type Feature = { corner: boolean; convex: boolean; cubics: Cubic[] }

/** The polygon's outline as one closed run of cubics, as the library lists them for drawing. */
function cubicsOf(features: Feature[]): Cubic[] {
  const out: Cubic[] = []
  let first: Cubic | null = null
  let last: Cubic | null = null
  let splitStart: Cubic[] | null = null
  let splitEnd: Cubic[] | null = null
  if (features.length > 0 && features[0]!.cubics.length === 3) {
    const [start, end] = split(features[0]!.cubics[1]!, 0.5)
    splitStart = [features[0]!.cubics[0]!, start]
    splitEnd = [end, features[0]!.cubics[2]!]
  }
  for (let i = 0; i <= features.length; i++) {
    let list: Cubic[]
    if (i === 0 && splitEnd) list = splitEnd
    else if (i === features.length) {
      if (!splitStart) break
      list = splitStart
    } else list = features[i]!.cubics
    for (const cubic of list) {
      if (!zeroLength(cubic)) {
        if (last) out.push(last)
        last = cubic
        if (!first) first = cubic
      } else if (last) {
        last = [...last.slice(0, 6), cubic[6], cubic[7]] as unknown as Cubic
      }
    }
  }
  if (last && first) out.push([...last.slice(0, 6), first[0], first[1]] as unknown as Cubic)
  return out
}

export class RoundedPolygon {
  readonly cubics: Cubic[]
  constructor(
    readonly features: Feature[],
    readonly center: Point,
  ) {
    this.cubics = cubicsOf(features)
  }
  transformed(f: Transform) {
    return new RoundedPolygon(
      this.features.map((feature) => ({
        ...feature,
        cubics: feature.cubics.map((c) => transformCubic(c, f)),
      })),
      f(this.center[0], this.center[1]),
    )
  }
  /** The bounds the library takes: those of every curve's anchors and control points. */
  bounds(): [minX: number, minY: number, maxX: number, maxY: number] {
    let [minX, minY, maxX, maxY] = [Infinity, Infinity, -Infinity, -Infinity]
    for (const c of this.cubics) {
      const xs = zeroLength(c) ? [c[0]] : [c[0], c[2], c[4], c[6]]
      const ys = zeroLength(c) ? [c[1]] : [c[1], c[3], c[5], c[7]]
      minX = Math.min(minX, ...xs)
      maxX = Math.max(maxX, ...xs)
      minY = Math.min(minY, ...ys)
      maxY = Math.max(maxY, ...ys)
    }
    return [minX, minY, maxX, maxY]
  }
  /** Scaled and moved so that its bounds fill a unit square, centered on any shorter side. */
  normalized() {
    const [minX, minY, maxX, maxY] = this.bounds()
    const width = maxX - minX
    const height = maxY - minY
    const side = Math.max(width, height)
    const offsetX = (side - width) / 2 - minX
    const offsetY = (side - height) / 2 - minY
    return this.transformed((x, y) => [(x + offsetX) / side, (y + offsetY) / side])
  }
}

class RoundedCorner {
  readonly d1: Point
  readonly d2: Point
  readonly cornerRadius: number
  readonly smoothing: number
  readonly cosAngle: number
  readonly sinAngle: number
  readonly expectedRoundCut: number
  constructor(
    readonly p0: Point,
    readonly p1: Point,
    readonly p2: Point,
    rounding: CornerRounding,
  ) {
    const v01 = sub(p0, p1)
    const v21 = sub(p2, p1)
    const d01 = distance(...v01)
    const d21 = distance(...v21)
    if (d01 > 0 && d21 > 0) {
      this.d1 = scale(v01, 1 / d01)
      this.d2 = scale(v21, 1 / d21)
      this.cornerRadius = rounding.radius
      this.smoothing = rounding.smoothing
      this.cosAngle = dot(this.d1, this.d2)
      this.sinAngle = Math.sqrt(1 - this.cosAngle * this.cosAngle)
      this.expectedRoundCut =
        this.sinAngle > 1e-3 ? (this.cornerRadius * (this.cosAngle + 1)) / this.sinAngle : 0
    } else {
      this.d1 = [0, 0]
      this.d2 = [0, 0]
      this.cornerRadius = 0
      this.smoothing = 0
      this.cosAngle = 0
      this.sinAngle = 0
      this.expectedRoundCut = 0
    }
  }
  get expectedCut() {
    return (1 + this.smoothing) * this.expectedRoundCut
  }
  cubics(allowedCut0: number, allowedCut1: number): Cubic[] {
    const allowedCut = Math.min(allowedCut0, allowedCut1)
    const { p1, d1, d2, expectedRoundCut, cornerRadius } = this
    if (
      expectedRoundCut < distanceEpsilon ||
      allowedCut < distanceEpsilon ||
      cornerRadius < distanceEpsilon
    ) {
      return [straightLine(p1[0], p1[1], p1[0], p1[1])]
    }
    const actualRoundCut = Math.min(allowedCut, expectedRoundCut)
    const actualSmoothing0 = this.actualSmoothing(allowedCut0)
    const actualSmoothing1 = this.actualSmoothing(allowedCut1)
    const actualR = (cornerRadius * actualRoundCut) / expectedRoundCut
    const centerDistance = Math.sqrt(actualR * actualR + actualRoundCut * actualRoundCut)
    const mid = scale(add(d1, d2), 0.5)
    const center = add(p1, scale(direction(mid[0], mid[1]), centerDistance))
    const circleIntersection0 = add(p1, scale(d1, actualRoundCut))
    const circleIntersection2 = add(p1, scale(d2, actualRoundCut))
    const flanking0 = this.flankingCurve(
      actualRoundCut,
      actualSmoothing0,
      p1,
      this.p0,
      circleIntersection0,
      circleIntersection2,
      center,
      actualR,
    )
    const flanking2 = reverse(
      this.flankingCurve(
        actualRoundCut,
        actualSmoothing1,
        p1,
        this.p2,
        circleIntersection2,
        circleIntersection0,
        center,
        actualR,
      ),
    )
    return [
      flanking0,
      circularArc(center[0], center[1], flanking0[6], flanking0[7], flanking2[0], flanking2[1]),
      flanking2,
    ]
  }
  private actualSmoothing(allowedCut: number) {
    if (allowedCut > this.expectedCut) return this.smoothing
    if (allowedCut > this.expectedRoundCut) {
      return (
        (this.smoothing * (allowedCut - this.expectedRoundCut)) /
        (this.expectedCut - this.expectedRoundCut)
      )
    }
    return 0
  }
  private flankingCurve(
    actualRoundCut: number,
    actualSmoothing: number,
    corner: Point,
    sideStart: Point,
    circleSegmentIntersection: Point,
    otherCircleSegmentIntersection: Point,
    circleCenter: Point,
    actualR: number,
  ): Cubic {
    const side = sub(sideStart, corner)
    const sideDirection = direction(side[0], side[1])
    const curveStart = add(corner, scale(sideDirection, actualRoundCut * (1 + actualSmoothing)))
    const halfway = scale(add(circleSegmentIntersection, otherCircleSegmentIntersection), 0.5)
    const p: Point = [
      lerp(circleSegmentIntersection[0], halfway[0], actualSmoothing),
      lerp(circleSegmentIntersection[1], halfway[1], actualSmoothing),
    ]
    const curveEnd = add(
      circleCenter,
      scale(direction(p[0] - circleCenter[0], p[1] - circleCenter[1]), actualR),
    )
    const circleTangent = rotate90(sub(curveEnd, circleCenter))
    const anchorEnd =
      lineIntersection(sideStart, sideDirection, curveEnd, circleTangent) ??
      circleSegmentIntersection
    const anchorStart = scale(add(curveStart, scale(anchorEnd, 2)), 1 / 3)
    return [
      curveStart[0],
      curveStart[1],
      anchorStart[0],
      anchorStart[1],
      anchorEnd[0],
      anchorEnd[1],
      curveEnd[0],
      curveEnd[1],
    ]
  }
}

function lineIntersection(p0: Point, d0: Point, p1: Point, d1: Point): Point | null {
  const rotated = rotate90(d1)
  const den = dot(d0, rotated)
  if (Math.abs(den) < distanceEpsilon) return null
  const num = dot(sub(p1, p0), rotated)
  if (Math.abs(den) < distanceEpsilon * Math.abs(num)) return null
  return add(p0, scale(d0, num / den))
}

const convex = (previous: Point, current: Point, next: Point) => {
  const a = sub(current, previous)
  const b = sub(next, current)
  return a[0] * b[1] - a[1] * b[0] > 0
}

/** A polygon through vertices (x, y pairs), its corners rounded as given, each or all alike. */
export function roundedPolygon(
  vertices: number[],
  rounding: CornerRounding,
  perVertexRounding: CornerRounding[] | null,
  center: Point,
): RoundedPolygon {
  const n = vertices.length / 2
  const vertex = (i: number): Point => [vertices[(i % n) * 2]!, vertices[(i % n) * 2 + 1]!]
  const corners: RoundedCorner[] = []
  for (let i = 0; i < n; i++) {
    corners.push(
      new RoundedCorner(
        vertex(i + n - 1),
        vertex(i),
        vertex(i + 1),
        perVertexRounding?.[i] ?? rounding,
      ),
    )
  }
  const cutAdjusts: [number, number][] = []
  for (let ix = 0; ix < n; ix++) {
    const next = corners[(ix + 1) % n]!
    const expectedRoundCut = corners[ix]!.expectedRoundCut + next.expectedRoundCut
    const expectedCut = corners[ix]!.expectedCut + next.expectedCut
    const [vx, vy] = vertex(ix)
    const [nx, ny] = vertex(ix + 1)
    const sideSize = distance(vx - nx, vy - ny)
    if (expectedRoundCut > sideSize) cutAdjusts.push([sideSize / expectedRoundCut, 0])
    else if (expectedCut > sideSize) {
      cutAdjusts.push([1, (sideSize - expectedRoundCut) / (expectedCut - expectedRoundCut)])
    } else cutAdjusts.push([1, 1])
  }
  const cornerCubics: Cubic[][] = []
  for (let i = 0; i < n; i++) {
    const allowed: number[] = []
    for (let delta = 0; delta <= 1; delta++) {
      const [roundCutRatio, cutRatio] = cutAdjusts[(i + n - 1 + delta) % n]!
      const corner = corners[i]!
      allowed.push(
        corner.expectedRoundCut * roundCutRatio +
          (corner.expectedCut - corner.expectedRoundCut) * cutRatio,
      )
    }
    cornerCubics.push(corners[i]!.cubics(allowed[0]!, allowed[1]!))
  }
  const features: Feature[] = []
  for (let i = 0; i < n; i++) {
    const cubics = cornerCubics[i]!
    const next = cornerCubics[(i + 1) % n]!
    features.push({
      corner: true,
      convex: convex(vertex(i + n - 1), vertex(i), vertex(i + 1)),
      cubics,
    })
    const last = cubics[cubics.length - 1]!
    features.push({
      corner: false,
      convex: false,
      cubics: [straightLine(last[6], last[7], next[0]![0], next[0]![1])],
    })
  }
  return new RoundedPolygon(features, center)
}

const radial = (radius: number, angle: number): Point => [
  radius * Math.cos(angle),
  radius * Math.sin(angle),
]

/** The library's circle: a polygon whose rounding is the circle, so the curves are its arcs. */
export function circle(numVertices: number, radius = 1): RoundedPolygon {
  const polygonRadius = radius / Math.cos(Math.PI / numVertices)
  const vertices: number[] = []
  for (let i = 0; i < numVertices; i++) {
    vertices.push(...radial(polygonRadius, (Math.PI / numVertices) * 2 * i))
  }
  return roundedPolygon(vertices, { radius, smoothing: 0 }, null, [0, 0])
}

/** The library's star: outer and inner vertices in turn, each kind rounded its own way. */
export function star(
  numVerticesPerRadius: number,
  innerRadius: number,
  rounding: CornerRounding,
  innerRounding: CornerRounding,
  radius = 1,
): RoundedPolygon {
  const vertices: number[] = []
  const perVertex: CornerRounding[] = []
  for (let i = 0; i < numVerticesPerRadius; i++) {
    vertices.push(...radial(radius, (Math.PI / numVerticesPerRadius) * 2 * i))
    vertices.push(...radial(innerRadius, (Math.PI / numVerticesPerRadius) * (2 * i + 1)))
    perVertex.push(rounding, innerRounding)
  }
  return roundedPolygon(vertices, rounding, perVertex, [0, 0])
}

/* The morph: both outlines measured along their length (the library's three-chord measure),
 * their corners matched by nearness, and each outline cut where the other has a curve, so
 * that curve pairs can be blended. */

const measureSegments = 3

/** The length of a curve as the library measures it, and the parameter at a distance along it. */
function closestProgressTo(c: Cubic, threshold: number): [progress: number, length: number] {
  let total = 0
  let remainder = threshold
  let prev = pointOnCurve(c, 0)
  for (let i = 1; i <= measureSegments; i++) {
    const progress = i / measureSegments
    const point = pointOnCurve(c, progress)
    const segment = distance(point[0] - prev[0], point[1] - prev[1])
    if (segment >= remainder) {
      return [progress - (1 - remainder / segment) / measureSegments, threshold]
    }
    remainder -= segment
    total += segment
    prev = point
  }
  return [1, total]
}
const measureCubic = (c: Cubic) => closestProgressTo(c, Infinity)[1]
const findCubicCutPoint = (c: Cubic, m: number) => closestProgressTo(c, m)[0]

type MeasuredCubic = { cubic: Cubic; start: number; end: number; size: number }
type ProgressableFeature = { progress: number; feature: Feature }

function cutAtProgress(m: MeasuredCubic, cut: number): [MeasuredCubic, MeasuredCubic] {
  const bounded = Math.min(m.end, Math.max(m.start, cut))
  const relative = (bounded - m.start) / (m.end - m.start)
  const t = findCubicCutPoint(m.cubic, relative * m.size)
  const [c1, c2] = split(m.cubic, t)
  return [
    { cubic: c1, start: m.start, end: bounded, size: measureCubic(c1) },
    { cubic: c2, start: bounded, end: m.end, size: measureCubic(c2) },
  ]
}

class MeasuredPolygon {
  readonly cubics: MeasuredCubic[]
  constructor(
    readonly features: ProgressableFeature[],
    cubics: Cubic[],
    outlineProgress: number[],
  ) {
    const measured: MeasuredCubic[] = []
    let start = 0
    for (let i = 0; i < cubics.length; i++) {
      if (outlineProgress[i + 1]! - outlineProgress[i]! > distanceEpsilon) {
        measured.push({
          cubic: cubics[i]!,
          start,
          end: outlineProgress[i + 1]!,
          size: measureCubic(cubics[i]!),
        })
        start = outlineProgress[i + 1]!
      }
    }
    measured[measured.length - 1]!.end = 1
    this.cubics = measured
  }
  static measure(polygon: RoundedPolygon) {
    const cubics: Cubic[] = []
    const featureToCubic: [Feature, number][] = []
    for (const feature of polygon.features) {
      feature.cubics.forEach((cubic, index) => {
        if (feature.corner && index === Math.floor(feature.cubics.length / 2)) {
          featureToCubic.push([feature, cubics.length])
        }
        cubics.push(cubic)
      })
    }
    const measures = [0]
    for (const cubic of cubics) measures.push(measures[measures.length - 1]! + measureCubic(cubic))
    const total = measures[measures.length - 1]!
    const outlineProgress = measures.map((m) => m / total)
    const features = featureToCubic.map(([feature, ix]) => ({
      progress: positiveModulo((outlineProgress[ix]! + outlineProgress[ix + 1]!) / 2, 1),
      feature,
    }))
    return new MeasuredPolygon(features, cubics, outlineProgress)
  }
  cutAndShift(cuttingPoint: number): MeasuredPolygon {
    if (cuttingPoint < distanceEpsilon) return this
    const targetIndex = this.cubics.findIndex(
      (c) => cuttingPoint >= c.start && cuttingPoint <= c.end,
    )
    const target = this.cubics[targetIndex]!
    const [b1, b2] = cutAtProgress(target, cuttingPoint)
    const cubics = [b2.cubic]
    for (let i = 1; i < this.cubics.length; i++) {
      cubics.push(this.cubics[(i + targetIndex) % this.cubics.length]!.cubic)
    }
    cubics.push(b1.cubic)
    const outlineProgress: number[] = []
    for (let index = 0; index < this.cubics.length + 2; index++) {
      if (index === 0) outlineProgress.push(0)
      else if (index === this.cubics.length + 1) outlineProgress.push(1)
      else {
        const cubicIndex = (targetIndex + index - 1) % this.cubics.length
        outlineProgress.push(positiveModulo(this.cubics[cubicIndex]!.end - cuttingPoint, 1))
      }
    }
    const features = this.features.map((f) => ({
      progress: positiveModulo(f.progress - cuttingPoint, 1),
      feature: f.feature,
    }))
    return new MeasuredPolygon(features, cubics, outlineProgress)
  }
}

const progressInRange = (progress: number, from: number, to: number) =>
  to >= from ? progress >= from && progress <= to : progress >= from || progress <= to

function linearMap(xs: number[], ys: number[], x: number) {
  const startIndex = xs.findIndex((_, i) => progressInRange(x, xs[i]!, xs[(i + 1) % xs.length]!))
  const endIndex = (startIndex + 1) % xs.length
  const sizeX = positiveModulo(xs[endIndex]! - xs[startIndex]!, 1)
  const sizeY = positiveModulo(ys[endIndex]! - ys[startIndex]!, 1)
  const position = sizeX < 0.001 ? 0.5 : positiveModulo(x - xs[startIndex]!, 1) / sizeX
  return positiveModulo(ys[startIndex]! + sizeY * position, 1)
}

class DoubleMapper {
  private readonly source: number[]
  private readonly target: number[]
  constructor(mappings: [number, number][]) {
    this.source = mappings.map((m) => m[0])
    this.target = mappings.map((m) => m[1])
  }
  map(x: number) {
    return linearMap(this.source, this.target, x)
  }
  mapBack(x: number) {
    return linearMap(this.target, this.source, x)
  }
}

const progressDistance = (p1: number, p2: number) => {
  const d = Math.abs(p1 - p2)
  return Math.min(d, 1 - d)
}

const representativePoint = (feature: Feature): Point => {
  const first = feature.cubics[0]!
  const last = feature.cubics[feature.cubics.length - 1]!
  return [(first[0] + last[6]) / 2, (first[1] + last[7]) / 2]
}

function featureMapper(features1: ProgressableFeature[], features2: ProgressableFeature[]) {
  const corners1 = features1.filter((f) => f.feature.corner)
  const corners2 = features2.filter((f) => f.feature.corner)
  const vertices: { distance: number; f1: ProgressableFeature; f2: ProgressableFeature }[] = []
  for (const f1 of corners1) {
    for (const f2 of corners2) {
      if (f1.feature.convex !== f2.feature.convex) continue
      const d = sub(representativePoint(f1.feature), representativePoint(f2.feature))
      vertices.push({ distance: d[0] * d[0] + d[1] * d[1], f1, f2 })
    }
  }
  vertices.sort((a, b) => a.distance - b.distance)
  if (vertices.length === 0)
    return new DoubleMapper([
      [0, 0],
      [0.5, 0.5],
    ])
  if (vertices.length === 1) {
    const { f1, f2 } = vertices[0]!
    return new DoubleMapper([
      [f1.progress, f2.progress],
      [(f1.progress + 0.5) % 1, (f2.progress + 0.5) % 1],
    ])
  }
  const mapping: [number, number][] = []
  const used1 = new Set<ProgressableFeature>()
  const used2 = new Set<ProgressableFeature>()
  for (const { f1, f2 } of vertices) {
    if (used1.has(f1) || used2.has(f2)) continue
    let insertion = mapping.findIndex((m) => m[0] > f1.progress)
    if (insertion < 0) insertion = mapping.length
    const n = mapping.length
    if (n >= 1) {
      const [before1, before2] = mapping[(insertion + n - 1) % n]!
      const [after1, after2] = mapping[insertion % n]!
      if (
        progressDistance(f1.progress, before1) < distanceEpsilon ||
        progressDistance(f1.progress, after1) < distanceEpsilon ||
        progressDistance(f2.progress, before2) < distanceEpsilon ||
        progressDistance(f2.progress, after2) < distanceEpsilon
      ) {
        continue
      }
      if (n > 1 && !progressInRange(f2.progress, before2, after2)) continue
    }
    mapping.splice(insertion, 0, [f1.progress, f2.progress])
    used1.add(f1)
    used2.add(f2)
  }
  return new DoubleMapper(mapping)
}

/** The pairs of curves a morph from one polygon to the other blends between. */
export function morphMatch(start: RoundedPolygon, end: RoundedPolygon): [Cubic, Cubic][] {
  const measured1 = MeasuredPolygon.measure(start)
  const measured2 = MeasuredPolygon.measure(end)
  const mapper = featureMapper(measured1.features, measured2.features)
  const cutPoint = mapper.map(0)
  const bs1 = measured1.cubics
  const bs2 = measured2.cutAndShift(cutPoint).cubics
  const pairs: [Cubic, Cubic][] = []
  let i1 = 0
  let i2 = 0
  let b1: MeasuredCubic | undefined = bs1[i1++]
  let b2: MeasuredCubic | undefined = bs2[i2++]
  while (b1 && b2) {
    const b1a = i1 === bs1.length ? 1 : b1.end
    const b2a = i2 === bs2.length ? 1 : mapper.mapBack(positiveModulo(b2.end + cutPoint, 1))
    const minb = Math.min(b1a, b2a)
    let seg1: MeasuredCubic
    let seg2: MeasuredCubic
    if (b1a > minb + angleEpsilon) [seg1, b1] = cutAtProgress(b1, minb)
    else {
      seg1 = b1
      b1 = bs1[i1++]
    }
    if (b2a > minb + angleEpsilon) {
      ;[seg2, b2] = cutAtProgress(b2, positiveModulo(mapper.map(minb) - cutPoint, 1))
    } else {
      seg2 = b2
      b2 = bs2[i2++]
    }
    pairs.push([seg1.cubic, seg2.cubic])
  }
  return pairs
}

/** The morph's outline at a progress from the start polygon (0) to the end one (1). */
export function morphCubics(match: [Cubic, Cubic][], progress: number): Cubic[] {
  const out: Cubic[] = []
  let first: Cubic | null = null
  let last: Cubic | null = null
  for (const [a, b] of match) {
    const cubic = a.map((v, i) => lerp(v, b[i]!, progress)) as unknown as Cubic
    if (!first) first = cubic
    if (last) out.push(last)
    last = cubic
  }
  if (last && first) out.push([...last.slice(0, 6), first[0], first[1]] as unknown as Cubic)
  return out
}

/** The outline turned so that its first anchor lies at an angle from its pivot, 270 degrees being the top. */
export function startingAt(cubics: Cubic[], pivot: Point, startAngle: number): Cubic[] {
  const first = cubics[0]!
  const angle = Math.atan2(first[1] - pivot[1], first[0] - pivot[0])
  const by = (startAngle * Math.PI) / 180 - angle
  const [cos, sin] = [Math.cos(by), Math.sin(by)]
  return cubics.map((c) => transformCubic(c, (x, y) => [x * cos - y * sin, x * sin + y * cos]))
}

/** The bounds the drawing is centered by: those of every anchor and control point. */
export function boundsOf(
  cubics: Cubic[],
): [minX: number, minY: number, maxX: number, maxY: number] {
  let [minX, minY, maxX, maxY] = [Infinity, Infinity, -Infinity, -Infinity]
  for (const c of cubics) {
    for (let i = 0; i < 8; i += 2) {
      minX = Math.min(minX, c[i]!)
      maxX = Math.max(maxX, c[i]!)
      minY = Math.min(minY, c[i + 1]!)
      maxY = Math.max(maxY, c[i + 1]!)
    }
  }
  return [minX, minY, maxX, maxY]
}

/* A closed run of cubics measured along its length, so that a point can be found at a distance
 * along it, with its derivatives in that distance. */
const quadrature: [number, number][] = [
  [-0.9602898565, 0.1012285363],
  [-0.7966664774, 0.2223810345],
  [-0.525532409, 0.3137066459],
  [-0.1834346425, 0.3626837834],
  [0.1834346425, 0.3626837834],
  [0.525532409, 0.3137066459],
  [0.7966664774, 0.2223810345],
  [0.9602898565, 0.1012285363],
]

function lengthTo(c: Cubic, t: number) {
  let sum = 0
  for (const [x, w] of quadrature) {
    const [first] = derivatives(c, (t / 2) * (x + 1))
    sum += w * distance(first[0], first[1])
  }
  return (sum * t) / 2
}

const tableSize = 16

export class MeasuredPath {
  readonly length: number
  private readonly starts: number[] = []
  /** Each curve's length up to evenly spaced parameters, to start the search for a distance from. */
  private readonly tables: number[][] = []
  constructor(readonly cubics: Cubic[]) {
    let at = 0
    for (const c of cubics) {
      this.starts.push(at)
      const table = [0]
      for (let k = 1; k <= tableSize; k++) table.push(lengthTo(c, k / tableSize))
      this.tables.push(table)
      at += table[tableSize]!
    }
    this.length = at
  }
  /** The point at a distance along the run, counted round, with its first and second derivatives in distance. */
  at(distanceAlong: number): { point: Point; first: Point; second: Point } {
    const s = positiveModulo(distanceAlong, this.length)
    let i = this.cubics.length - 1
    // A hair short of a curve's start is its start: the curves bend differently at a join, and
    // which one is taken must not hang on a last digit, which JavaScript engines differ in.
    while (i > 0 && this.starts[i]! > s + this.length * 1e-9) i--
    const c = this.cubics[i]!
    const table = this.tables[i]!
    const target = s - this.starts[i]!
    let k = 0
    while (k < tableSize - 1 && table[k + 1]! < target) k++
    const span = table[k + 1]! - table[k]!
    let t = (k + (span > 0 ? (target - table[k]!) / span : 0)) / tableSize
    // One Newton step from the table's estimate is within a thousandth of a step.
    const [tangent] = derivatives(c, t)
    const rate = distance(tangent[0], tangent[1])
    if (rate > 0) t = Math.min(1, Math.max(0, t - (lengthTo(c, t) - target) / rate))
    const [first, second] = derivatives(c, t)
    const speed = distance(first[0], first[1])
    const unit: Point = [first[0] / speed, first[1] / speed]
    const along = dot(first, second) / (speed * speed)
    // By the chain rule: the second derivative in distance is the curvature's normal part.
    const curve: Point = [
      (second[0] - first[0] * along) / (speed * speed),
      (second[1] - first[1] * along) / (speed * speed),
    ]
    return { point: pointOnCurve(c, t), first: unit, second: curve }
  }
}
