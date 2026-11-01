import { List, ListItem, useDragAndDrop } from '@material-web/react'
import { isTextDropItem, Text, useListData } from 'react-aria-components'

type Task = { id: string; name: string }

function TaskList({ label, tasks }: { label: string; tasks: Task[] }) {
  const list = useListData({ initialItems: tasks })
  const { dragAndDropHooks } = useDragAndDrop({
    getItems: (keys) => [...keys].map((key) => ({ task: JSON.stringify(list.getItem(key)) })),
    acceptedDragTypes: ['task'],
    getDropOperation: () => 'move',
    onReorder(e) {
      if (e.target.dropPosition === 'before') list.moveBefore(e.target.key, e.keys)
      else if (e.target.dropPosition === 'after') list.moveAfter(e.target.key, e.keys)
    },
    async onInsert(e) {
      const dropped = await Promise.all(
        e.items.filter(isTextDropItem).map(async (item) => JSON.parse(await item.getText('task'))),
      )
      if (e.target.dropPosition === 'before') list.insertBefore(e.target.key, ...dropped)
      else if (e.target.dropPosition === 'after') list.insertAfter(e.target.key, ...dropped)
    },
    async onRootDrop(e) {
      const dropped = await Promise.all(
        e.items.filter(isTextDropItem).map(async (item) => JSON.parse(await item.getText('task'))),
      )
      list.append(...dropped)
    },
    onDragEnd(e) {
      if (e.dropOperation === 'move' && !e.isInternal) list.remove(...e.keys)
    },
  })
  return (
    <List
      aria-label={label}
      variant="segmented"
      className="min-h-40 w-64"
      items={list.items}
      dragAndDropHooks={dragAndDropHooks}
      renderEmptyState={() => (
        <Text className="block p-space-200 text-on-surface-variant">Drop a task here</Text>
      )}
    >
      {(task) => <ListItem>{task.name}</ListItem>}
    </List>
  )
}

export default function BetweenLists() {
  return (
    <>
      <TaskList
        label="To do"
        tasks={[
          { id: 'tickets', name: 'Book the tickets' },
          { id: 'hotel', name: 'Find a hotel' },
          { id: 'pack', name: 'Pack the bags' },
        ]}
      />
      <TaskList label="Done" tasks={[{ id: 'passport', name: 'Renew the passport' }]} />
    </>
  )
}
