import { Tab, TabList, TabPanel, Tabs } from '@material-web/react'

export default function Fixed() {
  return (
    <Tabs>
      <TabList>
        <Tab id="driving">Driving</Tab>
        <Tab id="transit">Public transit</Tab>
        <Tab id="walking">Walking</Tab>
      </TabList>
      <TabPanel id="driving" className="p-space-300 text-body-md">
        Routes by car.
      </TabPanel>
      <TabPanel id="transit" className="p-space-300 text-body-md">
        Routes by bus and train.
      </TabPanel>
      <TabPanel id="walking" className="p-space-300 text-body-md">
        Routes on foot.
      </TabPanel>
    </Tabs>
  )
}
