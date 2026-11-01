import type { Meta, StoryObj } from '@storybook/react-vite'
import { Dialog, DialogTrigger, Heading, Link, Text } from 'react-aria-components'
import { AppBar } from '../app-bar'
import { Button } from '../button'
import { Icon } from '../icon'
import { IconButton } from '../icon-button'
import {
  PreviewTrigger,
  Tooltip,
  TooltipPopover,
  TooltipTrigger,
  type TooltipPopoverProps,
} from './tooltip'

// Every prop of Tooltip, its own variant and React Aria's Tooltip's: the docgen reads none of them
// from the imported types, so each is listed here. A tooltip opens 0.5s into a hover, or at once on
// keyboard focus, and closes 1.5s after the pointer leaves.
const meta = {
  title: 'Components/Tooltip',
  component: Tooltip,
  parameters: { layout: 'centered' },
  args: { variant: 'plain', children: 'Add to favorites' },
  argTypes: {
    variant: { control: 'inline-radio', options: ['plain', 'rich'], table: { category: 'M3' } },
    children: { control: 'text', table: { category: 'Parts' } },
    // Where it is placed: on which side of its trigger, how far from it and from the window's edge.
    placement: {
      control: 'select',
      options: [
        'top',
        'bottom',
        'left',
        'right',
        'start',
        'end',
        'top start',
        'top end',
        'bottom start',
        'bottom end',
        'left top',
        'left bottom',
        'right top',
        'right bottom',
        'start top',
        'start bottom',
        'end top',
        'end bottom',
      ],
      table: { category: 'Placement' },
    },
    offset: { control: 'number', table: { category: 'Placement' } },
    crossOffset: { control: 'number', table: { category: 'Placement' } },
    shouldFlip: { control: 'boolean', table: { category: 'Placement' } },
    containerPadding: { control: 'number', table: { category: 'Placement' } },
    arrowBoundaryOffset: { control: 'number', table: { category: 'Placement' } },
    triggerRef: { control: false, table: { category: 'Placement' } },
    UNSTABLE_portalContainer: { control: false, table: { category: 'Placement' } },
    // Open on its own, apart from its trigger's state.
    isOpen: { control: 'boolean', table: { category: 'State' } },
    defaultOpen: { control: 'boolean', table: { category: 'State' } },
    isEntering: { control: 'boolean', table: { category: 'State' } },
    isExiting: { control: 'boolean', table: { category: 'State' } },
    'aria-label': { control: 'text', table: { category: 'Accessibility' } },
    'aria-labelledby': { control: 'text', table: { category: 'Accessibility' } },
    'aria-describedby': { control: 'text', table: { category: 'Accessibility' } },
    'aria-details': { control: 'text', table: { category: 'Accessibility' } },
    dir: { control: 'inline-radio', options: ['ltr', 'rtl', 'auto'], table: { category: 'DOM' } },
    lang: { control: 'text', table: { category: 'DOM' } },
    translate: { control: 'inline-radio', options: ['yes', 'no'], table: { category: 'DOM' } },
    hidden: { control: 'boolean', table: { category: 'DOM' } },
    inert: { control: 'boolean', table: { category: 'DOM' } },
    className: { control: 'text', table: { category: 'Styling' } },
    style: { control: 'object', table: { category: 'Styling' } },
    render: { control: false, table: { category: 'Styling' } },
    ref: { control: false, table: { category: 'Styling' } },
  },
} satisfies Meta<typeof Tooltip>

export default meta
type Story = StoryObj<typeof meta>

const actions = [
  ['Add to favorites', 'star'],
  ['Share', 'share'],
  ['Download', 'download'],
  ['Delete', 'delete'],
] as const

/** Hover the icon button, or Tab to it: a plain tooltip labels it, 4dp above it. */
export const Playground: Story = {
  render: (args) => (
    <TooltipTrigger>
      <IconButton aria-label="Add to favorites">
        <Icon name="star" />
      </IconButton>
      <Tooltip {...args} />
    </TooltipTrigger>
  ),
}

/** Plain tooltips label icon-only buttons, one at a time: hovering the next one while one is open swaps them at once. The first is open from the start. */
export const Plain: Story = {
  render: (args) => (
    <div className="flex gap-space-100 pt-space-800">
      {actions.map(([label, icon], index) => (
        <TooltipTrigger key={label} defaultOpen={index === 0}>
          <IconButton aria-label={label}>
            <Icon name={icon} />
          </IconButton>
          <Tooltip {...args}>{label}</Tooltip>
        </TooltipTrigger>
      ))}
    </div>
  ),
}

/** In an app bar a plain tooltip is below its button, at the same 4dp. */
export const InAppBar: Story = {
  parameters: { layout: 'fullscreen' },
  render: (args) => (
    <AppBar className="pb-space-800">
      <Heading slot="headline">Photos</Heading>
      {actions.slice(0, 3).map(([label, icon], index) => (
        <TooltipTrigger key={label} defaultOpen={index === 0}>
          <IconButton slot="trailing" aria-label={label}>
            <Icon name={icon} />
          </IconButton>
          <Tooltip {...args} placement="bottom">
            {label}
          </Tooltip>
        </TooltipTrigger>
      ))}
    </AppBar>
  ),
}

/** Its text wraps past 200dp, which the spec advises against. */
export const MultiLine: Story = {
  args: {
    children:
      'Grant value is calculated using the closing stock price from the day before the grant date. Amounts do not reflect tax withholdings.',
  },
  render: (args) => (
    <div className="pt-24">
      <TooltipTrigger defaultOpen>
        <IconButton aria-label="Grant value">
          <Icon name="info" />
        </IconButton>
        <Tooltip {...args} />
      </TooltipTrigger>
    </div>
  ),
}

/** On each side of its trigger, by React Aria's `placement`, 4dp away; it flips to the other side where the window has no room. */
export const Placement: Story = {
  render: (args) => (
    <div className="grid grid-cols-2 gap-x-32 gap-y-space-800 p-space-800">
      {(['top', 'bottom', 'left', 'right'] as const).map((placement) => (
        <TooltipTrigger key={placement} defaultOpen>
          <IconButton aria-label={placement}>
            <Icon name="star" />
          </IconButton>
          <Tooltip {...args} placement={placement}>
            {placement}
          </Tooltip>
        </TooltipTrigger>
      ))}
    </div>
  ),
}

/** Rich, a subhead and its supporting text, centered below its trigger. A rich tooltip with no buttons is a `Tooltip` still. */
export const Rich: Story = {
  args: { variant: 'rich' },
  render: (args) => (
    <div className="pb-40">
      <TooltipTrigger defaultOpen>
        <IconButton aria-label="Favorite">
          <Icon name="star" />
        </IconButton>
        <Tooltip {...args}>
          <Heading>Favorite</Heading>
          Find this later in your favorites.
        </Tooltip>
      </TooltipTrigger>
    </div>
  ),
}

/** A rich tooltip with a link and a button, a TooltipPopover in a PreviewTrigger: it opens as a tooltip does, stays open while the pointer is over it, and Tab from the button moves the focus into it, through the link to its button, then on past the trigger. */
export const RichWithActions: Story = {
  render: () => (
    <div className="flex gap-space-200 pb-40">
      <PreviewTrigger>
        <IconButton aria-label="Permissions">
          <Icon name="lock" />
        </IconButton>
        <TooltipPopover>
          <Heading>Permissions</Heading>
          <Text>
            Configure permissions for selected service accounts. You can add and remove service
            account members and assign roles to them. Visit{' '}
            <Link href="#permissions" className="text-primary underline">
              permission settings
            </Link>{' '}
            for details.
          </Text>
          <Button variant="text">Request access</Button>
        </TooltipPopover>
      </PreviewTrigger>
      <IconButton aria-label="Next">
        <Icon name="arrow_forward" className="rtl:icon-mirrored" />
      </IconButton>
    </div>
  ),
}

/** A persistent rich tooltip, opened by a press: a TooltipPopover in React Aria's DialogTrigger, `isNonModal`, around a React Aria `Dialog`, which takes the focus. It stays open as the pointer leaves, and closes once another element is pressed, which takes the press, or on Escape; Tab stays in it, as in any React Aria dialog. */
export const Persistent: Story = {
  render: () => (
    <div className="flex gap-space-200 pb-44">
      <DialogTrigger>
        <Button variant="outlined">Image quality</Button>
        <TooltipPopover isNonModal>
          <Dialog>
            {({ close }) => (
              <>
                <Heading slot="title">New settings available</Heading>
                <Text>
                  Now you can adjust the uploaded image quality, and upgrade your available storage
                  space.
                </Text>
                <Button variant="text" onPress={close}>
                  Got it
                </Button>
                <Button variant="text">Learn more</Button>
              </>
            )}
          </Dialog>
        </TooltipPopover>
      </DialogTrigger>
      <Button variant="text">Storage</Button>
    </div>
  ),
}

const supporting =
  'Rich tooltips bring attention to a particular element or feature that warrants a person’s focus.'

/** One rich tooltip of the five configurations the specs draw, its trigger above it. */
function Configuration({
  subhead,
  buttons,
  ...props
}: TooltipPopoverProps & { subhead?: boolean; buttons: number }) {
  return (
    <PreviewTrigger defaultOpen>
      <IconButton aria-label="Rich tooltip">
        <Icon name="info" />
      </IconButton>
      <TooltipPopover {...props}>
        {subhead && <Heading>Rich tooltip</Heading>}
        <Text>{supporting}</Text>
        {Array.from({ length: buttons }, (_, index) => (
          <Button key={index} variant="text">
            Action
          </Button>
        ))}
      </TooltipPopover>
    </PreviewTrigger>
  )
}

/** The specs' five configurations: a subhead with two buttons, with one and with none; supporting text alone with one button and with two. */
export const Configurations: Story = {
  parameters: { layout: 'fullscreen' },
  render: () => (
    <div className="grid auto-rows-[14rem] grid-cols-[repeat(3,21rem)] justify-center justify-items-center p-space-400">
      <Configuration subhead buttons={2} />
      <Configuration subhead buttons={1} />
      <Configuration subhead buttons={0} />
      <Configuration buttons={1} />
      <Configuration buttons={2} />
    </div>
  ),
}

/** A disabled TooltipTrigger, whose button shows no tooltip; a disabled button shows none either. */
export const Disabled: Story = {
  render: (args) => (
    <div className="flex gap-space-100">
      <TooltipTrigger isDisabled>
        <IconButton aria-label="Share">
          <Icon name="share" />
        </IconButton>
        <Tooltip {...args}>Share</Tooltip>
      </TooltipTrigger>
      <TooltipTrigger>
        <IconButton aria-label="Delete" isDisabled>
          <Icon name="delete" />
        </IconButton>
        <Tooltip {...args}>Delete</Tooltip>
      </TooltipTrigger>
    </div>
  ),
}
