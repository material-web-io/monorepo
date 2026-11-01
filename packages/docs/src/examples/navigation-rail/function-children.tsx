import { Icon, NavigationRail, NavigationRailItem } from '@material-web/react'
import { useState } from 'react'
import { Text } from 'react-aria-components'

const destinations = ['Explore', 'Saved', 'Updates']

export default function FunctionChildren() {
  const [page, setPage] = useState('Saved')
  return (
    <div className="flex h-96">
      <NavigationRail aria-label="Main">
        {destinations.map((name) => (
          <NavigationRailItem key={name} isSelected={page === name} onChange={() => setPage(name)}>
            {({ isSelected }) => (
              <>
                <Icon name={isSelected ? 'check_circle' : 'circle'} />
                <Text slot="label">{name}</Text>
              </>
            )}
          </NavigationRailItem>
        ))}
      </NavigationRail>
      <div className="m-space-200 min-w-0 flex-1 rounded-shape-xl bg-primary-container p-space-300 text-title-lg text-on-primary-container">
        {page}
      </div>
    </div>
  )
}
