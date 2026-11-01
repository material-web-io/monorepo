import { Chip, ChipGroup, Icon } from '@material-web/react'

export default function Elevated() {
  return (
    <div className="rounded-shape-lg bg-tertiary-container p-space-600">
      <ChipGroup aria-label="Elevated" selectionMode="multiple" defaultSelectedKeys={['filter']}>
        <Chip id="assist" variant="assist" isElevated textValue="Assist">
          <Icon slot="leading" name="event" />
          Assist
        </Chip>
        <Chip id="filter" variant="filter" isElevated textValue="Filter">
          {({ isSelected }) => (
            <>
              {isSelected && <Icon slot="leading" name="check" />}
              Filter
            </>
          )}
        </Chip>
        <Chip id="suggestion" variant="suggestion" isElevated>
          Suggestion
        </Chip>
      </ChipGroup>
    </div>
  )
}
