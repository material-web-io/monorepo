import { List, ListItem, twMerge } from '@material-web/react'
import { Text } from 'react-aria-components'

const steps = ['', 'density-1', 'density-2', 'density-3']

export default function Density() {
  return (
    <>
      {steps.map((density) => (
        <List
          key={density}
          aria-label={`Contacts, ${density || 'default density'}`}
          variant="segmented"
          className={twMerge('w-40', density)}
        >
          <ListItem id="density">{density || 'Default'}</ListItem>
          <ListItem id="ali" textValue="Ali Connors">
            <Text slot="label">Ali Connors</Text>
            <Text slot="description">Brunch?</Text>
          </ListItem>
        </List>
      ))}
    </>
  )
}
