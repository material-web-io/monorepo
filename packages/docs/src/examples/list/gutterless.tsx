import { Card, List, ListItem } from '@material-web/react'
import { Text } from 'react-aria-components'

const details = [
  { id: 'size', label: 'Size', value: '2.4 MB' },
  { id: 'modified', label: 'Modified', value: 'Nov 6, 2026' },
  { id: 'owner', label: 'Owner', value: 'Ali Connors' },
]

export default function Gutterless() {
  return (
    <Card variant="filled" className="w-80 px-space-300 py-space-200">
      <div className="text-title-md">Details</div>
      <List aria-label="File details" items={details}>
        {(detail) => (
          <ListItem textValue={detail.label} className="bg-transparent px-0">
            <Text slot="label">{detail.label}</Text>
            <Text slot="trailing">{detail.value}</Text>
          </ListItem>
        )}
      </List>
    </Card>
  )
}
