import { Tab, TabList, TabPanel, Tabs } from '@material-web/react'

export default function AutomaticActivation() {
  return (
    <Tabs keyboardActivation="automatic">
      <TabList>
        <Tab id="flights">Flights</Tab>
        <Tab id="trips">Trips</Tab>
        <Tab id="explore">Explore</Tab>
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
