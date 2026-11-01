import { Chip, ChipGroup, Icon } from '@material-web/react'

const genres = ['Jazz', 'Soul', 'Funk', 'Disco']

export default function Colors() {
  return (
    <ChipGroup aria-label="Genres" selectionMode="multiple" defaultSelectedKeys={['jazz', 'funk']}>
      {genres.map((genre) => (
        <Chip
          key={genre}
          id={genre.toLowerCase()}
          variant="filter"
          textValue={genre}
          className="selected:bg-tertiary-container selected:text-on-tertiary-container"
        >
          {({ isSelected }) => (
            <>
              {isSelected && <Icon slot="leading" name="check" />}
              {genre}
            </>
          )}
        </Chip>
      ))}
    </ChipGroup>
  )
}
