import {
  BottomSheet,
  Button,
  Divider,
  Icon,
  List,
  ListItem,
  SheetTrigger,
} from '@material-web/react'
import { Heading, Text } from 'react-aria-components'

const orders = [
  ['Name', 'sort_by_alpha'],
  ['Last modified', 'schedule'],
  ['Size', 'straighten'],
] as const

export default function WithoutDragHandle() {
  return (
    <SheetTrigger>
      <Button variant="tonal">Sort files</Button>
      <BottomSheet isModal hasDragHandle={false} className="pt-space-300">
        {({ state }) => (
          <>
            <Heading slot="title" className="m-0 px-space-200 pb-space-100 text-title-lg">
              Sort by
            </Heading>
            <List aria-label="Sort by">
              {orders.map(([name, icon]) => (
                <ListItem
                  key={name}
                  id={name}
                  textValue={name}
                  className="bg-transparent"
                  onAction={() => state.close()}
                >
                  <Icon slot="leading" name={icon} />
                  <Text slot="label">{name}</Text>
                </ListItem>
              ))}
            </List>
            <Divider />
            <div className="flex justify-end p-space-200">
              <Button variant="text" slot="close">
                Cancel
              </Button>
            </div>
          </>
        )}
      </BottomSheet>
    </SheetTrigger>
  )
}
