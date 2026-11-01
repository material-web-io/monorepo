import { Icon, NavigationBar, NavigationBarItem } from '@material-web/react'
import { useState } from 'react'
import { Text } from 'react-aria-components'

const destinations = ['Explore', 'Saved', 'Updates']

export default function FunctionChildren() {
  const [page, setPage] = useState('Saved')
  return (
    <div className="flex h-64 flex-col justify-end">
      <NavigationBar aria-label="Main">
        {destinations.map((name) => (
          <NavigationBarItem key={name} isSelected={page === name} onChange={() => setPage(name)}>
            {({ isSelected }) => (
              <>
                <Icon name={isSelected ? 'check_circle' : 'circle'} />
                <Text slot="label">{name}</Text>
              </>
            )}
          </NavigationBarItem>
        ))}
      </NavigationBar>
    </div>
  )
}
