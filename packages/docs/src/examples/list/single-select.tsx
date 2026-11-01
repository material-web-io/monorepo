import { Icon, List, ListItem } from '@material-web/react'
import { Text } from 'react-aria-components'

const sounds = ['Chime', 'Ripple', 'Sonar', 'Beacon']

export default function SingleSelect() {
  return (
    <List
      aria-label="Notification sound"
      variant="segmented"
      className="w-90"
      selectionMode="single"
      defaultSelectedKeys={['Ripple']}
    >
      {sounds.map((sound) => (
        <ListItem key={sound} id={sound} textValue={sound}>
          {({ isSelected }) => (
            <>
              <Icon slot="leading" name={isSelected ? 'check' : 'music_note'} />
              <Text slot="label">{sound}</Text>
            </>
          )}
        </ListItem>
      ))}
    </List>
  )
}
