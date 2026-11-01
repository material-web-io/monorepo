import type { Meta, StoryObj } from '@storybook/react-vite'
import { Fragment, useState, type ReactNode } from 'react'
import { Text, useListData, type Key } from 'react-aria-components'
import { Icon } from '../icon'
import { Chip, ChipGroup, type ChipProps, type ChipRenderProps } from '.'
import { IconButton } from '../icon-button'

// The stories' args are those of an assist, filter or suggestion chip, which may be elevated; the
// Playground's variant control offers the input chip too.
type Args = ChipProps<Exclude<ChipProps['variant'], 'input'>>

/** A round avatar of an initial on a color, as a data URL, as an image from a profile would be. */
const avatar = (initial: string, color: string) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48"><rect width="48" height="48" fill="${color}"/><text x="24" y="32" font-family="sans-serif" font-size="24" fill="white" text-anchor="middle">${initial}</text></svg>`,
  )}`

/** A filter chip's label, with a checkmark in its leading slot while it is selected. */
const checked =
  (label: string) =>
  ({ isSelected }: ChipRenderProps) => (
    <>
      {isSelected && <Icon slot="leading" name="check" />}
      {label}
    </>
  )

/** React Aria's remove Button, in the Tag's remove slot, an input chip's. */
const remove = (
  <IconButton slot="remove" aria-label="Remove">
    <Icon name="close" />
  </IconButton>
)

// Every prop of Chip, its M3 props and React Aria's Tag's: the docgen reads none of them from the
// imported types, so each is listed here. The group's selection and removal are the ChipGroup's.
const meta = {
  title: 'Components/Chip',
  component: Chip,
  parameters: { layout: 'centered' },
  args: {
    variant: 'assist',
    children: 'Label',
  },
  argTypes: {
    variant: {
      control: 'radio',
      options: ['assist', 'filter', 'input', 'suggestion'],
      table: { category: 'M3' },
    },
    isElevated: { control: 'boolean', table: { category: 'M3' } },
    // The label text; the Slots story fills the leading, trailing and remove slots.
    children: { control: 'text', table: { category: 'Parts' } },
    // Its key in the group, and its name for typeahead.
    id: { control: 'text', table: { category: 'Value' } },
    textValue: { control: 'text', table: { category: 'Value' } },
    isDisabled: { control: 'boolean', table: { category: 'State' } },
    // A link, which the tag is given an href.
    href: { control: 'text', table: { category: 'Link' } },
    hrefLang: { control: 'text', table: { category: 'Link' } },
    target: { control: 'text', table: { category: 'Link' } },
    rel: { control: 'text', table: { category: 'Link' } },
    download: { control: 'text', table: { category: 'Link' } },
    ping: { control: 'text', table: { category: 'Link' } },
    referrerPolicy: { control: 'text', table: { category: 'Link' } },
    routerOptions: { control: false, table: { category: 'Link' } },
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
} satisfies Meta<Args>

export default meta
type Story = StoryObj<Meta<Args>>

const caption = 'text-label-md text-on-surface-variant'

/** A group's label, before it, naming it, as the spec asks of a group of chips. */
function Labelled({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-space-150">
      <span id={id} className="text-title-sm text-on-surface">
        {label}
      </span>
      {children}
    </div>
  )
}

/** A chip in a group that selects and removes, so a press, Space, Enter, Backspace or Delete does. */
export const Playground: Story = {
  render: (args) => (
    <ChipGroup aria-label="Playground" selectionMode="multiple" onRemove={() => {}}>
      <Chip id="chip" {...args} />
    </ChipGroup>
  ),
}

/** The four variants: assist, filter, input and suggestion. */
export const Variants: Story = {
  render: () => (
    <ChipGroup aria-label="Variants" selectionMode="multiple" onRemove={() => {}}>
      <Chip variant="assist" id="assist" textValue="Assist">
        <Icon slot="leading" name="event" />
        Assist
      </Chip>
      <Chip id="filter" variant="filter" textValue="Filter">
        {checked('Filter')}
      </Chip>
      <Chip id="input" variant="input" textValue="Input">
        <Text slot="label">Input</Text>
        {remove}
      </Chip>
      <Chip id="suggestion" variant="suggestion">
        Suggestion
      </Chip>
    </ChipGroup>
  ),
}

/** Its slots, React Aria's, by variant: every chip has `leading`, drawn before the label; a filter chip has `trailing` as well, drawn after it; an input chip has `remove` in its place, React Aria's `<Button slot="remove">`, the remove button; an assist or suggestion chip has `leading` alone. An `Icon` in a slot is drawn in the slot's size and colors, whatever order the slots are written in. An image is the avatar, in the leading slot or none. The label is the chip's text, or React Aria's `Text` given `slot="label"`, which takes the room a wider chip has, centered beside a remove button, and is cut short with an ellipsis in a chip too narrow for it. A chip whose children are not plain text is named by its `textValue`, which its types then require, as a `Tag` asks. */
export const Slots: Story = {
  render: () => (
    <ChipGroup aria-label="Slots" onRemove={() => {}}>
      <Chip variant="assist" id="leading" textValue="Leading icon">
        <Icon slot="leading" name="event" />
        Leading icon
      </Chip>
      <Chip id="trailing" variant="filter" textValue="Trailing icon">
        Trailing icon
        <Icon slot="trailing" name="arrow_drop_down" />
      </Chip>
      <Chip id="both" variant="filter" textValue="Both">
        <Icon slot="leading" name="sell" />
        Both
        <Icon slot="trailing" name="arrow_drop_down" />
      </Chip>
      <Chip id="avatar" variant="input" textValue="Avatar">
        <img slot="leading" alt="" src={avatar('A', '#6750a4')} />
        <Text slot="label">Avatar</Text>
        {remove}
      </Chip>
    </ChipGroup>
  ),
}

/** Assist chips act (`onAction`), on the chip or on the group with the chip's `id`. */
export const Assist: Story = {
  render: function Render() {
    const [action, setAction] = useState<Key>()
    return (
      <div className="flex flex-col gap-space-200">
        <ChipGroup aria-label="Actions" onAction={setAction}>
          <Chip variant="assist" id="calendar" textValue="Add to calendar">
            <Icon slot="leading" name="event" />
            Add to calendar
          </Chip>
          <Chip variant="assist" id="directions" textValue="Get directions">
            <Icon slot="leading" name="directions" />
            Get directions
          </Chip>
          <Chip variant="assist" id="share" textValue="Share">
            <Icon slot="leading" name="share" />
            Share
          </Chip>
        </ChipGroup>
        <span className={caption}>{action ? `Last action: ${action}` : 'No action yet'}</span>
      </div>
    )
  },
}

/** Filter chips select (`selectionMode="multiple"`, or `single`): selected, one draws its checkmark. */
export const Filter: Story = {
  render: () => (
    <div className="flex flex-col gap-space-400">
      <Labelled id="diet" label="Select diet">
        <ChipGroup aria-labelledby="diet" selectionMode="multiple" defaultSelectedKeys={['vegan']}>
          {['Vegan', 'Gluten free', 'Organic', 'Local'].map((label) => (
            <Chip key={label} id={label.toLowerCase()} variant="filter" textValue={label}>
              {checked(label)}
            </Chip>
          ))}
        </ChipGroup>
      </Labelled>
      <Labelled id="sort" label="Sort by">
        <ChipGroup aria-labelledby="sort" selectionMode="single" defaultSelectedKeys={['price']}>
          {['Price', 'Rating', 'Distance'].map((label) => (
            <Chip key={label} id={label.toLowerCase()} variant="filter" textValue={label}>
              {(state) => (
                <>
                  {checked(label)(state)}
                  <Icon slot="trailing" name="arrow_drop_down" />
                </>
              )}
            </Chip>
          ))}
        </ChipGroup>
      </Labelled>
    </div>
  ),
}

/** Input chips are removed (`onRemove`) by their remove button, or by Backspace or Delete. */
export const Input: Story = {
  render: function Render() {
    const people = useListData({
      initialItems: [
        { id: 'ann', name: 'Ann Lee', avatar: avatar('A', '#6750a4') },
        { id: 'bo', name: 'Bo Chen', avatar: avatar('B', '#386a20') },
        { id: 'cy', name: 'Cy Park', avatar: avatar('C', '#9c4146') },
      ],
    })
    return (
      <Labelled id="recipients" label="To">
        <ChipGroup
          aria-labelledby="recipients"
          items={people.items}
          onRemove={(keys) => people.remove(...keys)}
          renderEmptyState={() => <span className={caption}>No recipients</span>}
        >
          {(person) => (
            <Chip variant="input" textValue={person.name}>
              <img slot="leading" alt="" src={person.avatar} />
              <Text slot="label">{person.name}</Text>
              {remove}
            </Chip>
          )}
        </ChipGroup>
      </Labelled>
    )
  },
}

/** Suggestion chips offer what to say or search next. */
export const Suggestion: Story = {
  render: function Render() {
    const [reply, setReply] = useState<Key>()
    return (
      <div className="flex w-80 flex-col gap-space-200">
        <ChipGroup aria-label="Suggestions" onAction={setReply}>
          {['What song is this?', 'What are the lyrics?', 'Who is the artist?'].map((label) => (
            <Chip key={label} id={label} variant="suggestion">
              {label}
            </Chip>
          ))}
        </ChipGroup>
        <span className={caption}>{reply ? `Asked: ${reply}` : 'Nothing asked yet'}</span>
      </div>
    )
  },
}

/** Elevated assist, filter and suggestion chips, as on an image; an input chip is always flat. */
export const Elevated: Story = {
  render: () => (
    <div className="rounded-shape-lg bg-[linear-gradient(135deg,#d0bcff,#ffd8e4)] p-space-600">
      <ChipGroup aria-label="Elevated" selectionMode="multiple" defaultSelectedKeys={['filter']}>
        <Chip variant="assist" id="assist" isElevated textValue="Assist">
          <Icon slot="leading" name="event" />
          Assist
        </Chip>
        <Chip id="filter" variant="filter" isElevated textValue="Filter">
          {checked('Filter')}
        </Chip>
        <Chip id="suggestion" variant="suggestion" isElevated>
          Suggestion
        </Chip>
      </ChipGroup>
    </div>
  ),
}

const variants = ['assist', 'filter', 'input', 'suggestion'] as const
const columns = [
  { name: 'Enabled', selected: false, disabled: false },
  { name: 'Selected', selected: true, disabled: false },
  { name: 'Disabled', selected: false, disabled: true },
  { name: 'Selected, disabled', selected: true, disabled: true },
]

/** Every variant flat and elevated, enabled, selected and disabled; only filter and input chips draw selection. Hover, focus and press the enabled ones. */
export const States: Story = {
  render: () => (
    <div className="grid grid-cols-[auto_repeat(4,auto)] items-center justify-items-start gap-x-space-300 gap-y-space-200">
      <span />
      {columns.map(({ name }) => (
        <span key={name} className={caption}>
          {name}
        </span>
      ))}
      {variants.flatMap((variant) =>
        (variant === 'input' ? [false] : [false, true]).map((isElevated) => (
          <Fragment key={`${variant}-${isElevated}`}>
            <span className={caption}>
              {variant}
              {isElevated ? ', elevated' : ''}
            </span>
            {columns.map(({ name, selected, disabled }) => (
              <ChipGroup
                key={name}
                aria-label={`${variant} ${name}`}
                selectionMode="multiple"
                onRemove={() => {}}
                defaultSelectedKeys={selected ? ['chip'] : []}
                disabledKeys={disabled ? ['chip'] : []}
              >
                {variant === 'input' ? (
                  <Chip id="chip" variant="input" textValue="Label">
                    <Icon slot="leading" name="person" />
                    <Text slot="label">Label</Text>
                    {remove}
                  </Chip>
                ) : variant === 'filter' ? (
                  <Chip id="chip" variant="filter" isElevated={isElevated} textValue="Label">
                    {checked('Label')}
                  </Chip>
                ) : (
                  <Chip id="chip" variant={variant} isElevated={isElevated} textValue="Label">
                    <Icon slot="leading" name="event" />
                    Label
                  </Chip>
                )}
              </ChipGroup>
            ))}
          </Fragment>
        )),
      )}
    </div>
  ),
}

/** Disabled chips, by `isDisabled` on the chip or `disabledKeys` on the group. */
export const Disabled: Story = {
  render: () => (
    <ChipGroup aria-label="Disabled" disabledKeys={['filter']} selectionMode="multiple">
      <Chip variant="assist" id="assist" isDisabled textValue="Assist">
        <Icon slot="leading" name="event" />
        Assist
      </Chip>
      <Chip id="filter" variant="filter" textValue="Filter">
        {checked('Filter')}
      </Chip>
      <Chip id="suggestion" variant="suggestion" isElevated isDisabled>
        Suggestion
      </Chip>
    </ChipGroup>
  ),
}
