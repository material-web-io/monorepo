import { List } from '@material-web/react'
import { Text } from 'react-aria-components'

export default function Empty() {
  return (
    <List
      aria-label="Results"
      className="w-90"
      renderEmptyState={() => (
        <Text className="block px-space-200 py-space-150 text-body-lg text-on-surface-variant">
          No results
        </Text>
      )}
    >
      {[]}
    </List>
  )
}
