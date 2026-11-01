import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button, Heading, Text } from 'react-aria-components'
import { Icon } from '../icon'
import { IconButton } from '../icon-button'
import { AppBar, type AppBarProps } from '.'

// Every prop, the M3 ones and the header's own that the controls can show: the docgen reads none
// of them from the imported types.
const meta = {
  title: 'Components/AppBar',
  component: AppBar,
  parameters: { layout: 'fullscreen' },
  args: { variant: 'small', isScrolled: false, scrollBehavior: 'pinned' },
  argTypes: {
    variant: {
      control: 'inline-radio',
      options: ['small', 'medium-flexible', 'large-flexible'],
      table: { category: 'M3' },
    },
    scrollBehavior: {
      control: 'inline-radio',
      options: ['pinned', 'enter-always', 'exit-until-collapsed'],
      table: { category: 'M3' },
    },
    isScrolled: { control: 'boolean', table: { category: 'M3' } },
    children: { control: false, table: { category: 'Parts' } },
    'aria-label': { control: 'text', table: { category: 'Accessibility' } },
    id: { control: 'text', table: { category: 'DOM' } },
    dir: { control: 'text', table: { category: 'DOM' } },
    lang: { control: 'text', table: { category: 'DOM' } },
    hidden: { control: 'boolean', table: { category: 'DOM' } },
    className: { control: 'text', table: { category: 'Styling' } },
    style: { control: 'object', table: { category: 'Styling' } },
  },
} satisfies Meta<typeof AppBar>

export default meta
type Story = StoryObj<typeof meta>

const label = 'text-label-md text-on-surface-variant'

const Back = () => (
  <IconButton slot="leading" aria-label="Back">
    <Icon name="arrow_back" />
  </IconButton>
)

const Menu = () => (
  <IconButton slot="leading" aria-label="Menu">
    <Icon name="menu" />
  </IconButton>
)

const Action = ({ name, icon }: { name: string; icon: string }) => (
  <IconButton slot="trailing" aria-label={name}>
    <Icon name={icon} />
  </IconButton>
)

/** A 32dp avatar, an element of yours: the bar centers it in a 48dp target. */
const Avatar = () => (
  <span
    slot="trailing"
    role="img"
    aria-label="Account"
    className="grid size-8 place-items-center rounded-full bg-primary text-title-md text-on-primary"
  >
    A
  </span>
)

/** A logo for the image stories, drawn here so they load nothing. */
const logo = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 32"><text x="120" y="25" text-anchor="middle" font-family="Georgia, serif" font-size="26" font-weight="700" fill="#1D1B20">The Fortnightly</text></svg>',
)}`

/** Body text for what scrolls under a bar. */
const paragraphs = Array.from({ length: 60 }, (_, index) => (
  <p key={index} className="m-0 px-space-200 py-space-100 text-body-lg text-on-surface">
    Hey! I’ve got pics and more info on our cabin for the weekend. Get ready to be impressed: it
    looks absolutely incredible from what I can see.
  </p>
))

/** An app bar draws its children as written, each in its slot: what leads in `leading`, React Aria's `Heading` in `headline` and its `Text` in `subtitle`, and what trails in `trailing`. */
export const Playground: Story = {
  render: (args) => (
    <AppBar {...args}>
      <Back />
      <Heading slot="headline">Headline</Heading>
      <Text slot="subtitle">Subtitle</Text>
      <Action name="Search" icon="search" />
      <Action name="Today" icon="event" />
    </AppBar>
  ),
}

/** Small, medium flexible and large flexible: the headline is title large, headline medium and display small. */
export const Variants: Story = {
  render: (args) => (
    <div className="flex flex-col gap-space-300">
      {(['small', 'medium-flexible', 'large-flexible'] as const).map((variant) => (
        <AppBar key={variant} {...args} variant={variant}>
          <Back />
          <Heading slot="headline">Headline</Heading>
          <Action name="Search" icon="search" />
          <Action name="Today" icon="event" />
        </AppBar>
      ))}
    </div>
  ),
}

/** The medium flexible and large flexible app bars hug the text contents, so they are taller when a subtitle is visible. */
export const Subtitle: Story = {
  render: (args) => (
    <div className="grid grid-cols-2 items-start gap-space-300">
      {(['small', 'medium-flexible', 'large-flexible'] as const).flatMap((variant) =>
        [false, true].map((subtitle) => (
          <AppBar key={`${variant}-${subtitle}`} {...args} variant={variant}>
            <Back />
            <Heading slot="headline">Headline</Heading>
            {subtitle && <Text slot="subtitle">Subtitle</Text>}
            <Action name="Search" icon="search" />
            <Action name="Today" icon="event" />
          </AppBar>
        )),
      )}
    </div>
  ),
}

/** Text labels, including supporting text, can be aligned to the leading edge or centered: `text-center` on the bar centers them. */
export const TextAlignment: Story = {
  render: (args) => (
    <div className="grid grid-cols-2 items-start gap-space-300">
      {(['small', 'medium-flexible', 'large-flexible'] as const).flatMap((variant) =>
        [undefined, 'text-center'].map((className) => (
          <AppBar key={`${variant}-${className}`} {...args} variant={variant} className={className}>
            <Back />
            <Heading slot="headline">Headline</Heading>
            <Text slot="subtitle">Subtitle</Text>
            <Action name="Search" icon="search" />
            <Action name="Today" icon="event" />
          </AppBar>
        )),
      )}
    </div>
  ),
}

/** A flexible bar's headline wraps to a second line; a small bar's stays on one. */
export const LongHeadline: Story = {
  render: (args) => (
    <div className="flex flex-col gap-space-300">
      {(['small', 'medium-flexible', 'large-flexible'] as const).map((variant) => (
        <AppBar key={variant} {...args} variant={variant}>
          <Back />
          <Heading slot="headline">Hiking trips with Elie in Santa Monica and Joshua Tree!</Heading>
          <Action name="Map" icon="map" />
          <Action name="Hiking" icon="hiking" />
        </AppBar>
      ))}
    </div>
  ),
}

/** An image can be placed in the app bar. In small app bars, this can replace the label text: the heading holds it, and is named by its alt text. */
export const Image: Story = {
  render: (args) => (
    <AppBar {...args} className="text-center">
      <Back />
      <Heading slot="headline">
        <img src={logo} alt="The Fortnightly" className="mx-auto block h-8" />
      </Heading>
      <Action name="Save" icon="bookmark" />
    </AppBar>
  ),
}

/** The trailing icon buttons can be replaced with a single filled or tonal icon button, to boost a primary action. */
export const FilledTrailingButton: Story = {
  render: (args) => (
    <div className="flex flex-col gap-space-300">
      <AppBar {...args} variant="large-flexible">
        <Back />
        <Heading slot="headline">Headline</Heading>
        <Text slot="subtitle">Subtitle</Text>
        <IconButton slot="trailing" variant="filled" aria-label="Send">
          <Icon name="send" className="icon-filled" />
        </IconButton>
      </AppBar>
      <AppBar {...args} className="text-center">
        <Back />
        <Heading slot="headline">Headline</Heading>
        <IconButton slot="trailing" variant="tonal" width="wide" aria-label="Send">
          <Icon name="send" className="icon-filled" />
        </IconButton>
      </AppBar>
    </div>
  ),
}

/** With no leading button the text is 16dp from the edge; an avatar is centered in a 48dp target. */
export const Elements: Story = {
  render: (args) => (
    <div className="flex flex-col gap-space-300">
      <AppBar {...args}>
        <Heading slot="headline">Headline</Heading>
        <Action name="Search" icon="search" />
      </AppBar>
      <AppBar {...args} className="text-center">
        <Menu />
        <Heading slot="headline">Product</Heading>
        <Avatar />
      </AppBar>
    </div>
  ),
}

/** A search app bar has React Aria's `Button` in its `search` slot, the search bar: a leading element and a trailing one outside it, a trailing icon inside it as well, and two outside. */
export const Search: Story = {
  render: (args) => (
    <div className="flex flex-col gap-space-300">
      <AppBar {...args} className="text-center">
        <Menu />
        <Button slot="search">Search product</Button>
        <Avatar />
      </AppBar>
      <AppBar {...args} className="text-center">
        <Menu />
        <Button slot="search">
          Search product
          <Icon slot="trailing" name="mic" className="icon-filled" />
        </Button>
        <Avatar />
      </AppBar>
      <AppBar {...args}>
        <Menu />
        <Button slot="search">Search product</Button>
        <Action name="Ask" icon="auto_awesome" />
        <Avatar />
      </AppBar>
    </div>
  ),
}

/** The search bar fills the room between what leads and what trails until it is 312dp wide, stays centered on the bar from there, and past 624dp of room takes half of it. Resize the window. */
export const SearchOnLargeScreens: Story = {
  render: (args) => (
    <AppBar {...args} className="text-center">
      <Menu />
      <Button slot="search">Search news</Button>
      <Action name="Ask" icon="auto_awesome" />
      <Avatar />
    </AppBar>
  ),
}

/** Flat, and on scroll: the container changes color to surface container, and a search bar to surface container highest. `isScrolled` is yours to set over what the bar reads from the page. */
export const OnScroll: Story = {
  render: (args) => (
    <div className="grid grid-cols-2 items-start gap-x-space-300 gap-y-space-200">
      {[false, true].map((scrolled) => (
        <div key={String(scrolled)} className="flex flex-col gap-space-200">
          <span className={label}>{scrolled ? 'On scroll' : 'Flat'}</span>
          <AppBar {...args} isScrolled={scrolled} className="text-center">
            <Menu />
            <Button slot="search">
              Search product
              <Icon slot="trailing" name="mic" className="icon-filled" />
            </Button>
            <Avatar />
          </AppBar>
          {(['small', 'medium-flexible', 'large-flexible'] as const).map((variant) => (
            <AppBar key={variant} {...args} isScrolled={scrolled} variant={variant}>
              <Back />
              <Heading slot="headline">Headline</Heading>
              <Action name="Search" icon="search" />
            </AppBar>
          ))}
        </div>
      ))}
    </div>
  ),
}

const scrolling = (props: AppBarProps, headline = 'Top Stories') => (
  <>
    <AppBar {...props}>
      <Back />
      <Heading slot="headline">{headline}</Heading>
      <Action name="More options" icon="more_vert" />
    </AppBar>
    {paragraphs}
  </>
)

/** `scrollBehavior="pinned"`, the default: the bar remains at the top of what scrolls under it, and fills with a contrasting color on scroll. */
export const Pinned: Story = {
  args: { scrollBehavior: 'pinned', isScrolled: undefined },
  render: (args) => scrolling(args),
}

/** `scrollBehavior="enter-always"`: the bar collapses as the page is scrolled down, and expands as soon as it is scrolled back up. A small bar collapses to nothing. Left part way, it settles on the nearer end. */
export const EnterAlways: Story = {
  args: { scrollBehavior: 'enter-always', isScrolled: undefined },
  render: (args) => scrolling(args, 'Aki Aro'),
}

const flexible = (props: AppBarProps) => (
  <>
    <AppBar {...props}>
      <Back />
      <Heading slot="headline">Recap from June 12-19</Heading>
      <Text slot="subtitle">8 photos</Text>
      <Action name="Search" icon="search" />
      <Action name="Favorite" icon="favorite" />
    </AppBar>
    {paragraphs}
  </>
)

/** A flexible bar that enters always collapses into its row, a small app bar: the headline scrolls away under it while the small title and the fill come in. Any scroll back up brings the headline back. */
export const EnterAlwaysFlexible: Story = {
  args: { scrollBehavior: 'enter-always', isScrolled: undefined, variant: 'medium-flexible' },
  render: (args) => flexible(args),
}

/** `scrollBehavior="exit-until-collapsed"`: the bar collapses as the page is scrolled down, and only expands when the page is scrolled all the way back to its top. */
export const ExitUntilCollapsed: Story = {
  args: {
    scrollBehavior: 'exit-until-collapsed',
    isScrolled: undefined,
    variant: 'large-flexible',
  },
  render: (args) => flexible(args),
}

/** The app bar’s layout is mirrored for right-to-left (RTL) languages. */
export const RightToLeft: Story = {
  render: (args) => (
    <div dir="rtl" className="flex flex-col gap-space-300">
      {(['small', 'large-flexible'] as const).map((variant) => (
        <AppBar key={variant} {...args} variant={variant}>
          <Back />
          <Heading slot="headline">כותרת</Heading>
          <Text slot="subtitle">כותרת משנה</Text>
          <Action name="Search" icon="search" />
        </AppBar>
      ))}
    </div>
  ),
}
