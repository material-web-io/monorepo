import { Icon, Tab, TabList, TabPanel, Tabs } from '@material-web/react'

export default function Basic() {
  return (
    <Tabs className="w-full">
      <TabList>
        <Tab id="flights">
          <Icon name="flight" />
          Flights
        </Tab>
        <Tab id="trips">
          <Icon name="luggage" />
          Trips
        </Tab>
        <Tab id="explore">
          <Icon name="explore" />
          Explore
        </Tab>
      </TabList>
      <TabPanel id="flights" className="p-space-300 text-body-md">
        Flights are listed here.
      </TabPanel>
      <TabPanel id="trips" className="p-space-300 text-body-md">
        Trips are listed here.
      </TabPanel>
      <TabPanel id="explore" className="p-space-300 text-body-md">
        Places to explore are listed here.
      </TabPanel>
    </Tabs>
  )
}
