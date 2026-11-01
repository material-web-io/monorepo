import { List, ListItem, Switch } from '@material-web/react'
import { Text } from 'react-aria-components'

const settings = ['Wi-Fi', 'Bluetooth', 'Airplane mode']

export default function InList() {
  return (
    <List aria-label="Settings" className="w-90">
      {settings.map((name) => (
        <ListItem key={name} id={name} textValue={name}>
          <Text slot="label">{name}</Text>
          <Switch slot="trailing" aria-label={name} defaultSelected={name === 'Wi-Fi'} />
        </ListItem>
      ))}
    </List>
  )
}
