import { Checkbox, List, ListItem } from '@material-web/react'
import { Text } from 'react-aria-components'

const extras = ['Pickles', 'Tomato', 'Lettuce']

export default function InList() {
  return (
    <List
      aria-label="Extras"
      selectionMode="multiple"
      defaultSelectedKeys={['Pickles']}
      className="w-90"
    >
      {extras.map((name) => (
        <ListItem key={name} id={name} textValue={name}>
          <Text slot="label">{name}</Text>
          <Checkbox slot="trailing" />
        </ListItem>
      ))}
    </List>
  )
}
