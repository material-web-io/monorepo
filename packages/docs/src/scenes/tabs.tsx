import { AppBar, Icon, IconButton, Tab, TabList, Tabs, twMerge } from '@material-web/react'
import { Heading } from 'react-aria-components'
import { PhoneTop } from '../components/phone'

const tabs = [
  ['Video', 'videocam'],
  ['Photos', 'photo'],
  ['Audio', 'music_note'],
] as const

const photos = [
  'bg-tertiary-container text-tertiary',
  'bg-primary-container text-primary',
  'bg-secondary-container text-secondary',
  'bg-surface-container-highest text-on-surface-variant',
]

/** Tabs under an app bar, the second one selected, over the photos it shows. */
export default function TabsScene() {
  return (
    <PhoneTop>
      <AppBar isScrolled={false}>
        <IconButton slot="leading" aria-label="Back">
          <Icon name="arrow_back" />
        </IconButton>
        <Heading slot="headline">Saved media</Heading>
        <IconButton slot="trailing" aria-label="More options">
          <Icon name="more_vert" />
        </IconButton>
      </AppBar>
      <Tabs defaultSelectedKey="Photos" className="w-full shrink-0">
        <TabList aria-label="Media">
          {tabs.map(([name, icon]) => (
            <Tab key={name} id={name}>
              <Icon name={icon} />
              {name}
            </Tab>
          ))}
        </TabList>
      </Tabs>
      <div className="grid shrink-0 grid-cols-2 gap-space-150 p-space-200 icon-48 icon-filled">
        {photos.map((photo) => (
          <span
            key={photo}
            className={twMerge('grid aspect-square place-items-center rounded-shape-lg', photo)}
          >
            <Icon name="landscape" />
          </span>
        ))}
      </div>
    </PhoneTop>
  )
}
