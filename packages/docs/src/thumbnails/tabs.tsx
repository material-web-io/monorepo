import { Icon, Tab, TabList, Tabs } from '@material-web/react'
import { StatusBar } from '../components/phone'

const tabs = [
  ['Flights', 'flight'],
  ['Trips', 'luggage'],
  ['Explore', 'explore'],
] as const

/** Tabs at the top of a phone's screen, the first one selected. */
export default function TabsThumbnail() {
  return (
    <div className="docs-thumbnail-screen h-40 w-64 self-end rounded-t-shape-xl border-b-0">
      <StatusBar />
      <Tabs className="w-full pt-space-100">
        <TabList aria-label="Travel">
          {tabs.map(([name, icon]) => (
            <Tab key={name} id={name}>
              <Icon name={icon} />
              {name}
            </Tab>
          ))}
        </TabList>
      </Tabs>
    </div>
  )
}
