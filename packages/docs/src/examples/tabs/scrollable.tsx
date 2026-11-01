import { Tab, TabList, TabPanel, Tabs } from '@material-web/react'

const breeds = [
  'Akita',
  'Alaskan',
  'Australian Shepherd',
  'Azawakh',
  'Barbet',
  'Basenji',
  'Beagle',
  'Border Collie',
  'Boxer',
  'Bulldog',
  'Chihuahua',
  'Dalmatian',
]

export default function Scrollable() {
  return (
    <Tabs defaultSelectedKey="Alaskan">
      <TabList isScrollable>
        {breeds.map((breed) => (
          <Tab key={breed} id={breed}>
            {breed}
          </Tab>
        ))}
      </TabList>
      {breeds.map((breed) => (
        <TabPanel key={breed} id={breed} className="p-space-300 text-body-md">
          About the {breed}.
        </TabPanel>
      ))}
    </Tabs>
  )
}
