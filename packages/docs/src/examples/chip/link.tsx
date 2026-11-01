import { Chip, ChipGroup, Icon } from '@material-web/react'

const pages = ['Overview', 'Specs', 'Guidelines']

export default function LinkChips() {
  return (
    <ChipGroup aria-label="Material Design pages on chips">
      {pages.map((page) => (
        <Chip
          key={page}
          id={page}
          variant="assist"
          textValue={page}
          href={`https://m3.material.io/components/chips/${page.toLowerCase()}`}
          target="_blank"
          rel="noreferrer"
        >
          <Icon slot="leading" name="open_in_new" />
          {page}
        </Chip>
      ))}
    </ChipGroup>
  )
}
