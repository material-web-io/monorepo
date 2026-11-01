import { Tab, TabList, TabPanel, Tabs } from '@material-web/react'

const destinations = ['Flights', 'Trips', 'Explore']

export default function TwoLevels() {
  return (
    <Tabs>
      <TabList>
        {destinations.map((name) => (
          <Tab key={name} id={name}>
            {name}
          </Tab>
        ))}
      </TabList>
      {destinations.map((name) => (
        <TabPanel key={name} id={name}>
          <Tabs variant="secondary">
            <TabList>
              <Tab id="upcoming">Upcoming</Tab>
              <Tab id="past">Past</Tab>
            </TabList>
            <TabPanel id="upcoming" className="p-space-300 text-body-md">
              Upcoming {name.toLowerCase()}.
            </TabPanel>
            <TabPanel id="past" className="p-space-300 text-body-md">
              Past {name.toLowerCase()}.
            </TabPanel>
          </Tabs>
        </TabPanel>
      ))}
    </Tabs>
  )
}
