import { Icon, List, ListItem } from '@material-web/react'
import { Text } from 'react-aria-components'

const picture = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 56"><rect width="100" height="56" fill="#6750A4"/><path d="M42 16 62 28 42 40Z" fill="#fff"/></svg>',
)}`

export default function Leading() {
  return (
    <List aria-label="Media" variant="segmented" className="w-90">
      <ListItem id="icon" textValue="Leading icon">
        <Icon slot="leading" name="star" />
        <Text slot="label">Leading icon</Text>
        <Text slot="description">20dp</Text>
      </ListItem>
      <ListItem id="avatar" textValue="Leading avatar">
        <span
          slot="leading"
          aria-hidden
          className="grid size-10 place-items-center rounded-full bg-primary-container text-title-md text-on-primary-container"
        >
          A
        </span>
        <Text slot="label">Leading avatar</Text>
        <Text slot="description">40dp, round</Text>
      </ListItem>
      <ListItem id="image" textValue="Leading image">
        <img
          slot="leading"
          src={picture}
          alt=""
          className="size-14 rounded-shape-sm object-cover"
        />
        <Text slot="label">Leading image</Text>
        <Text slot="description">56dp</Text>
      </ListItem>
      <ListItem id="video" textValue="Leading video">
        <img slot="leading" src={picture} alt="" className="h-14 w-25 rounded-shape-sm" />
        <Text slot="label">Leading video</Text>
        <Text slot="description">100 by 56dp</Text>
      </ListItem>
    </List>
  )
}
