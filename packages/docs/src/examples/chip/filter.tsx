import { Chip, ChipGroup, Icon } from '@material-web/react'
import { useState } from 'react'
import type { Selection } from 'react-aria-components'

const orders = ['Price', 'Rating', 'Distance']

export default function Filter() {
  const [selected, setSelected] = useState<Selection>(new Set(['price']))
  return (
    <div className="flex flex-col items-center gap-space-150">
      <span id="sort-by" className="text-title-sm text-on-surface">
        Sort by
      </span>
      <ChipGroup
        aria-labelledby="sort-by"
        selectionMode="single"
        selectedKeys={selected}
        onSelectionChange={setSelected}
      >
        {orders.map((order) => (
          <Chip key={order} id={order.toLowerCase()} variant="filter" textValue={order}>
            {({ isSelected }) => (
              <>
                {isSelected && <Icon slot="leading" name="check" />}
                {order}
              </>
            )}
          </Chip>
        ))}
      </ChipGroup>
    </div>
  )
}
