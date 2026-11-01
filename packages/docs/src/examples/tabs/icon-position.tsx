import { Icon, Tab, TabList, TabPanel, Tabs } from '@material-web/react'

export default function IconPosition() {
  return (
    <div className="flex flex-col gap-space-300">
      <Tabs>
        <TabList>
          <Tab id="overview">
            <Icon name="summarize" />
            Overview
          </Tab>
          <Tab id="specifications">
            <Icon name="list_alt" />
            Specifications
          </Tab>
        </TabList>
        <TabPanel id="overview" className="p-space-300 text-body-md">
          A primary tab stacks its icon over its label.
        </TabPanel>
        <TabPanel id="specifications" className="p-space-300 text-body-md">
          Every specification of the product.
        </TabPanel>
      </Tabs>
      <Tabs variant="secondary">
        <TabList>
          <Tab id="overview">
            <Icon name="summarize" />
            Overview
          </Tab>
          <Tab id="specifications">
            <Icon name="list_alt" />
            Specifications
          </Tab>
        </TabList>
        <TabPanel id="overview" className="p-space-300 text-body-md">
          A secondary tab puts its icon before its label.
        </TabPanel>
        <TabPanel id="specifications" className="p-space-300 text-body-md">
          Every specification of the product.
        </TabPanel>
      </Tabs>
    </div>
  )
}
