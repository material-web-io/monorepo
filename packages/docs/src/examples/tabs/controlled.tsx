import { Tab, TabList, TabPanel, Tabs } from '@material-web/react'
import { useState } from 'react'
import type { Key } from 'react-aria-components'

const destinations = ['Flights', 'Trips', 'Explore']

export default function Controlled() {
  const [selected, setSelected] = useState<Key>('Trips')
  return (
    <Tabs selectedKey={selected} onSelectionChange={setSelected}>
      <TabList>
        {destinations.map((name) => (
          <Tab key={name} id={name}>
            {name}
          </Tab>
        ))}
      </TabList>
      {destinations.map((name) => (
        <TabPanel key={name} id={name} className="p-space-300 text-body-md">
          Selected: {String(selected)}
        </TabPanel>
      ))}
    </Tabs>
  )
}
