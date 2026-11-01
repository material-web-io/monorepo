import { Chip, ChipGroup, Icon } from '@material-web/react'

export default function Variants() {
  return (
    <ChipGroup aria-label="Variants">
      <Chip id="assist" variant="assist" textValue="Assist">
        <Icon slot="leading" name="event" />
        Assist
      </Chip>
      <Chip id="filter" variant="filter" textValue="Filter">
        Filter
        <Icon slot="trailing" name="arrow_drop_down" />
      </Chip>
      <Chip id="input" variant="input" textValue="Input">
        <Icon slot="leading" name="person" />
        Input
      </Chip>
      <Chip id="suggestion" variant="suggestion">
        Suggestion
      </Chip>
    </ChipGroup>
  )
}
