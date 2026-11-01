import { List, ListItem, useDragAndDrop } from '@material-web/react'
import { Text, useListData } from 'react-aria-components'

export default function DragAndDrop() {
  const list = useListData({
    initialItems: [
      { id: 'ali', name: 'Ali Connors', message: 'Brunch this weekend?' },
      { id: 'sandra', name: 'Sandra Adams', message: 'Oui oui' },
      { id: 'trevor', name: 'Trevor Hansen', message: 'Birthday gift' },
      { id: 'britta', name: 'Britta Holt', message: 'Recipe to try' },
    ],
  })
  const { dragAndDropHooks } = useDragAndDrop({
    getItems: (keys) => [...keys].map((key) => ({ 'text/plain': list.getItem(key)?.name ?? '' })),
    onReorder(e) {
      if (e.target.dropPosition === 'before') list.moveBefore(e.target.key, e.keys)
      else if (e.target.dropPosition === 'after') list.moveAfter(e.target.key, e.keys)
    },
  })
  return (
    <List
      aria-label="Favorites"
      variant="segmented"
      className="w-90"
      items={list.items}
      dragAndDropHooks={dragAndDropHooks}
    >
      {(item) => (
        <ListItem textValue={item.name}>
          <Text slot="label">{item.name}</Text>
          <Text slot="description">{item.message}</Text>
        </ListItem>
      )}
    </List>
  )
}
