import { Chip, ChipGroup, Icon } from '@material-web/react'

export default function Disabled() {
  return (
    <ChipGroup aria-label="Disabled" selectionMode="multiple" disabledKeys={['filter']}>
      <Chip id="assist" variant="assist" isDisabled textValue="Assist">
        <Icon slot="leading" name="event" />
        Assist
      </Chip>
      <Chip id="filter" variant="filter">
        Filter
      </Chip>
      <Chip id="suggestion" variant="suggestion" isElevated isDisabled>
        Suggestion
      </Chip>
      <Chip id="enabled" variant="filter">
        Enabled
      </Chip>
    </ChipGroup>
  )
}
