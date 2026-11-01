import { Tab, TabList, TabPanel, Tabs } from '@material-web/react'
import { useState } from 'react'
import { RouterProvider } from 'react-aria-components'

export default function NavTabs() {
  // Stands in for the app's router: it keeps the current location in state.
  const [location, setLocation] = useState('#flights')
  return (
    <RouterProvider navigate={setLocation}>
      <Tabs selectedKey={location}>
        <TabList>
          <Tab id="#flights" href="#flights">
            Flights
          </Tab>
          <Tab id="#trips" href="#trips">
            Trips
          </Tab>
          <Tab id="#explore" href="#explore">
            Explore
          </Tab>
        </TabList>
        <TabPanel id={location} className="p-space-300 text-body-md">
          The location is {location}.
        </TabPanel>
      </Tabs>
    </RouterProvider>
  )
}
