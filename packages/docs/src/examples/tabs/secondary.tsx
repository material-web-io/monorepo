import { Tab, TabList, TabPanel, Tabs } from '@material-web/react'

export default function Secondary() {
  return (
    <Tabs variant="secondary">
      <TabList>
        <Tab id="overview">Overview</Tab>
        <Tab id="specifications">Specifications</Tab>
      </TabList>
      <TabPanel id="overview" className="p-space-300 text-body-md">
        An overview of the product.
      </TabPanel>
      <TabPanel id="specifications" className="p-space-300 text-body-md">
        Every specification of the product.
      </TabPanel>
    </Tabs>
  )
}
