import { Tab, TabList, TabPanel, Tabs, TextField } from '@material-web/react'

export default function KeepMounted() {
  return (
    <Tabs>
      <TabList>
        <Tab id="outbound">Outbound</Tab>
        <Tab id="return">Return</Tab>
      </TabList>
      <TabPanel id="outbound" shouldForceMount className="p-space-300 inert:hidden">
        <TextField label="Notes for the outbound flight" className="w-full" />
      </TabPanel>
      <TabPanel id="return" shouldForceMount className="p-space-300 inert:hidden">
        <TextField label="Notes for the return flight" className="w-full" />
      </TabPanel>
    </Tabs>
  )
}
