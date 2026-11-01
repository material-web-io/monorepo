import { announce } from '@react-aria/live-announcer'
import {
  useContext,
  useEffect,
  useRef,
  type AriaAttributes,
  type ComponentRef,
  type ElementType,
  type ForwardedRef,
} from 'react'
import {
  mergeProps,
  useButton,
  useFocusRing,
  useHover,
  useId,
  useToggleButton,
  useToggleButtonGroupItem,
  type AriaButtonOptions,
  type AriaToggleButtonOptions,
  type HoverEvents,
} from 'react-aria'
import {
  ButtonContext,
  ProgressBarContext,
  ToggleButtonContext,
  ToggleGroupStateContext,
  useContextProps,
  useRenderProps,
  type ButtonRenderProps as AriaButtonRenderProps,
  type ChildrenOrFunction,
  type ClassNameOrFunction,
  type Key,
  type SlotProps,
  type StyleOrFunction,
  type ToggleButtonRenderProps as AriaToggleButtonRenderProps,
} from 'react-aria-components'
import { useToggleState } from 'react-stately'
import type { Except, RefProps } from './aria'

/* React Aria's Button and ToggleButton, from its hooks, as its own compose them, on the element
 * given as `elementType`, which the two it ships leave out: what every button here is built on. */

/**
 * The state React Aria's Button reports: `isHovered`, `isPressed`, `isFocused`, `isFocusVisible`,
 * `isDisabled` and `isPending`.
 */
export type ButtonRenderProps = AriaButtonRenderProps

/**
 * The options of React Aria's useButton and its hover events, with `slot`, `className`, `style`
 * and `children` as functions of the state it reports, and the `ref` of the element rendered.
 * `elementType` is that element, as React Aria has it: a `<button>` unless given, an `<a>` in the
 * `button` role with its `href`, `target` and `rel` given `'a'`, or a component, given the props
 * React Aria hands it; the hooks take the ref of any `Element`, which the one the type renders is.
 */
export type ButtonProps<T extends ElementType = 'button'> = AriaButtonOptions<T> &
  HoverEvents &
  SlotProps &
  RefProps<ComponentRef<T> & Element> & {
    /**
     * Whether the button is in a pending state. This disables press and hover events
     * while retaining focusability, and announces the pending state to screen readers.
     */
    isPending?: boolean
    className?: ClassNameOrFunction<ButtonRenderProps>
    style?: StyleOrFunction<ButtonRenderProps>
    children?: ChildrenOrFunction<ButtonRenderProps>
  }

// What a pending button keeps of its handlers: the focus, hover and pointer-crossing ones, for
// tooltips and other overlays, as React Aria's Button keeps them.
const PENDING_KEEPS = /Focus|Blur|Hover|Pointer(Enter|Leave|Over|Out)|Mouse(Enter|Leave|Over|Out)/

// The props of a pending button: its other handlers and its link gone, as React Aria has it.
function pendingProps<Props extends object>(props: Props): Props {
  return {
    ...Object.fromEntries(
      Object.entries(props).map(([key, value]) => [
        key,
        key.startsWith('on') && !PENDING_KEEPS.test(key) ? undefined : value,
      ]),
    ),
    href: undefined,
    target: undefined,
  } as Props
}

/**
 * The pending state of React Aria's Button, for Button and ToggleButton alike: the button's props
 * without the handlers it drops, the attributes it renders, and the id of the progress bar in it.
 * Pending, it is named by its label and that progress bar (ProgressBarContext), says it is
 * unavailable, and says so to assistive technology as it begins and ends while focused.
 */
function usePending<Props extends AriaAttributes & { id?: string }>(
  isPending: boolean,
  props: Props,
  isFocused: boolean,
  type?: string,
) {
  const id = useId(props.id)
  const progressId = useId()
  let ariaLabelledby = props['aria-labelledby']
  if (isPending) {
    if (ariaLabelledby) ariaLabelledby = `${ariaLabelledby} ${progressId}`
    else if (props['aria-label']) ariaLabelledby = `${id} ${progressId}`
  }
  const wasPending = useRef(isPending)
  useEffect(() => {
    if (wasPending.current !== isPending && isFocused) {
      announce({ 'aria-labelledby': ariaLabelledby || id }, 'assertive')
    }
    wasPending.current = isPending
  }, [isPending, isFocused, ariaLabelledby, id])
  return {
    buttonProps: isPending ? pendingProps(props) : props,
    attributes: {
      // Pending, a submit button submits nothing, as React Aria has it.
      ...(isPending && type === 'submit' ? { type: 'button' } : undefined),
      id,
      'aria-labelledby': ariaLabelledby,
      'aria-disabled': isPending ? 'true' : props['aria-disabled'],
      'data-pending': isPending || undefined,
    },
    progressId,
  }
}

/**
 * React Aria's Button from its hooks, on the element given as `elementType`: its useButton,
 * useFocusRing and useHover, the state they report in the render props and the data attributes,
 * the props its ButtonContext gives the slot, and its pending state.
 */
export function Button<T extends ElementType = 'button'>({ ref, ...props }: ButtonProps<T>) {
  // React Aria types its ButtonContext on the <button> its Button renders; the element here is the
  // caller's elementType, which the context's ref lands on all the same.
  const [{ elementType, slot, isPending = false, className, style, children, ...rest }, rootRef] =
    useContextProps(props, ref as ForwardedRef<HTMLButtonElement>, ButtonContext)
  const Root: ElementType = elementType ?? 'button'
  const pressable = useButton({ ...rest, elementType: Root }, rootRef)
  const { focusProps, isFocused, isFocusVisible } = useFocusRing(rest)
  const pending = usePending(isPending, pressable.buttonProps, isFocused, rest.type)
  const { hoverProps, isHovered } = useHover({ ...rest, isDisabled: rest.isDisabled || isPending })
  const isDisabled = rest.isDisabled ?? false
  const isPressed = pressable.isPressed && !isPending
  const renderProps = useRenderProps({
    className,
    style,
    children,
    values: { isHovered, isPressed, isFocused, isFocusVisible, isDisabled, isPending },
    defaultClassName: 'react-aria-Button',
  })
  return (
    <Root
      {...mergeProps(pending.buttonProps, focusProps, hoverProps, renderProps)}
      {...pending.attributes}
      ref={rootRef}
      slot={slot || undefined}
      data-disabled={isDisabled || undefined}
      data-pressed={isPressed || undefined}
      data-hovered={isHovered || undefined}
      data-focused={isFocused || undefined}
      data-focus-visible={isFocusVisible || undefined}
    >
      <ProgressBarContext.Provider value={{ id: pending.progressId }}>
        {renderProps.children}
      </ProgressBarContext.Provider>
    </Root>
  )
}

/**
 * The state React Aria's ToggleButton reports: the Button's, `isSelected` and its toggle `state`,
 * with the Button's `isPending`, which its ToggleButton leaves out.
 */
export type ToggleButtonRenderProps = AriaToggleButtonRenderProps &
  Pick<AriaButtonRenderProps, 'isPending'>

/**
 * The options of React Aria's useToggleButton and its hover events, with `slot`, `className`,
 * `style` and `children` as functions of the state it reports, the `ref` of the element rendered,
 * and `elementType`, that element, and `isPending`, as `ButtonProps` has them.
 */
export type ToggleButtonProps<T extends ElementType = 'button'> = Except<
  AriaToggleButtonOptions<T>,
  'id'
> &
  HoverEvents &
  SlotProps &
  RefProps<ComponentRef<T> & Element> & {
    /**
     * When used in a ToggleButtonGroup, an identifier for the item in `selectedKeys`.
     * When used standalone, a DOM id.
     */
    id?: Key
    /**
     * Whether the button is in a pending state. This disables press and hover events
     * while retaining focusability, and announces the pending state to screen readers.
     */
    isPending?: boolean
    className?: ClassNameOrFunction<ToggleButtonRenderProps>
    style?: StyleOrFunction<ToggleButtonRenderProps>
    children?: ChildrenOrFunction<ToggleButtonRenderProps>
  }

/**
 * React Aria's ToggleButton from its hooks, on the element given as `elementType`: its
 * useToggleState and useToggleButton, or useToggleButtonGroupItem in a ToggleButtonGroup given an
 * `id`, with useFocusRing and useHover, the state they report in the render props and the data
 * attributes, `data-selected` among them, the props its ToggleButtonContext gives the slot, and
 * the pending state of its Button.
 */
export function ToggleButton<T extends ElementType = 'button'>({
  ref,
  ...props
}: ToggleButtonProps<T>) {
  // React Aria types its ToggleButtonContext on the <button> its ToggleButton renders; the element
  // here is the caller's elementType, which the context's ref lands on all the same.
  const [
    { elementType, slot, id, isPending = false, className, style, children, ...rest },
    rootRef,
  ] = useContextProps(props, ref as ForwardedRef<HTMLButtonElement>, ToggleButtonContext)
  const Root: ElementType = elementType ?? 'button'
  // In React Aria's ToggleButtonGroup, given an id, it is the group's item, which the group selects.
  const groupState = useContext(ToggleGroupStateContext)
  const inGroup = groupState !== null && id != null
  const state = useToggleState(
    inGroup
      ? {
          isSelected: groupState.selectedKeys.has(id),
          onChange: (isSelected) => groupState.setSelected(id, isSelected),
        }
      : rest,
  )
  // The two are useButton with the same hooks, so picking one is safe, as React Aria's ToggleButton
  // picks it.
  /* eslint-disable react-hooks/rules-of-hooks */
  const toggle = inGroup
    ? useToggleButtonGroupItem({ ...rest, id, elementType: Root }, groupState, rootRef)
    : useToggleButton(
        { ...rest, id: id != null ? String(id) : undefined, elementType: Root },
        state,
        rootRef,
      )
  /* eslint-enable react-hooks/rules-of-hooks */
  const { isSelected, isDisabled } = toggle
  const { focusProps, isFocused, isFocusVisible } = useFocusRing(rest)
  const pending = usePending(isPending, toggle.buttonProps, isFocused)
  const { hoverProps, isHovered } = useHover({ ...rest, isDisabled: isDisabled || isPending })
  const isPressed = toggle.isPressed && !isPending
  const renderProps = useRenderProps({
    className,
    style,
    children,
    values: {
      isHovered,
      isPressed,
      isFocused,
      isFocusVisible,
      isSelected: state.isSelected,
      isDisabled,
      isPending,
      state,
    },
    defaultClassName: 'react-aria-ToggleButton',
  })
  return (
    <Root
      {...mergeProps(pending.buttonProps, focusProps, hoverProps, renderProps)}
      {...pending.attributes}
      ref={rootRef}
      slot={slot || undefined}
      data-disabled={isDisabled || undefined}
      data-pressed={isPressed || undefined}
      data-selected={isSelected || undefined}
      data-hovered={isHovered || undefined}
      data-focused={isFocused || undefined}
      data-focus-visible={isFocusVisible || undefined}
    >
      <ProgressBarContext.Provider value={{ id: pending.progressId }}>
        {renderProps.children}
      </ProgressBarContext.Provider>
    </Root>
  )
}
