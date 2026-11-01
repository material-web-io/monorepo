import { Icon, Tab, TabList, TabPanel, Tabs } from '@material-web/react'

const destinations = [
  ['Flights', 'flight', 'Flights are listed here.'],
  ['Trips', 'luggage', 'Trips are listed here.'],
  ['Explore', 'explore', 'Places to explore are listed here.'],
] as const

export default function FunctionChildren() {
  return (
    <Tabs>
      <TabList>
        {destinations.map(([name, icon]) => (
          <Tab key={name} id={name}>
            {({ isSelected }) => (
              <>
                <Icon name={icon} className={isSelected ? 'icon-filled' : undefined} />
                {name}
              </>
            )}
          </Tab>
        ))}
      </TabList>
      {destinations.map(([name, , text]) => (
        <TabPanel key={name} id={name} className="p-space-300 text-body-md">
          {text}
        </TabPanel>
      ))}
    </Tabs>
  )
}
