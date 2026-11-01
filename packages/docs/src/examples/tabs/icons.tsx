import { Icon, Tab, TabList, TabPanel, Tabs } from '@material-web/react'

export default function Icons() {
  return (
    <Tabs>
      <TabList>
        <Tab id="favorites" aria-label="Favorites">
          <Icon name="favorite" />
        </Tab>
        <Tab id="nearby" aria-label="Nearby">
          <Icon name="location_on" />
        </Tab>
        <Tab id="recent" aria-label="Recent">
          <Icon name="history" />
        </Tab>
      </TabList>
      <TabPanel id="favorites" className="p-space-300 text-body-md">
        Your favorites.
      </TabPanel>
      <TabPanel id="nearby" className="p-space-300 text-body-md">
        What is nearby.
      </TabPanel>
      <TabPanel id="recent" className="p-space-300 text-body-md">
        What you opened recently.
      </TabPanel>
    </Tabs>
  )
}
