import { List, ListItem } from '@material-web/react'
import type { ReactNode } from 'react'
import { Text } from 'react-aria-components'

function Avatar({ children }: { children: ReactNode }) {
  return (
    <span
      slot="leading"
      aria-hidden
      className="grid size-10 place-items-center rounded-full bg-primary-container text-title-md text-on-primary-container"
    >
      {children}
    </span>
  )
}

export default function Align() {
  return (
    <List aria-label="Recent messages" variant="segmented" className="w-90">
      <ListItem id="ali" textValue="Ali Connors">
        <Avatar>A</Avatar>
        <Text slot="label">Ali Connors</Text>
        <Text slot="description">Brunch this weekend?</Text>
        <Text slot="trailing">15 min</Text>
      </ListItem>
      <ListItem id="sandra" textValue="Sandra Adams">
        <Avatar>S</Avatar>
        <Text slot="label">Sandra Adams</Text>
        <Text slot="description">
          Wish I could come, but I am out of town this weekend and the one after
        </Text>
        <Text slot="trailing">1 h</Text>
      </ListItem>
    </List>
  )
}
