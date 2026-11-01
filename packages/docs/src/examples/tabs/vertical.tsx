import { Tab, TabList, TabPanel, Tabs } from '@material-web/react'

export default function Vertical() {
  return (
    <Tabs orientation="vertical" className="w-full">
      <TabList>
        <Tab id="account">Account</Tab>
        <Tab id="notifications">Notifications</Tab>
        <Tab id="privacy">Privacy</Tab>
      </TabList>
      <TabPanel id="account" className="p-space-300 text-body-md">
        Account settings are listed here.
      </TabPanel>
      <TabPanel id="notifications" className="p-space-300 text-body-md">
        Notification settings are listed here.
      </TabPanel>
      <TabPanel id="privacy" className="p-space-300 text-body-md">
        Privacy settings are listed here.
      </TabPanel>
    </Tabs>
  )
}
