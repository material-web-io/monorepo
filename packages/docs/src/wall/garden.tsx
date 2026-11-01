import { AppBar, Checkbox, Chip, ChipGroup, Icon, IconButton } from '@material-web/react'
import { Heading } from 'react-aria-components'
import { Photo, Screen } from './screen'

const plants = [
  ['Pothos', true],
  ['Maidenhair fern', false],
  ['Monstera', false],
  ['Snake plant', false],
] as const

/** A board of ideas for a garden: a big title, pictures laid on it askew and a list to tick off. */
export default function Garden() {
  return (
    <Screen edge="top" theme="light">
      <AppBar variant="large-flexible" isScrolled={false}>
        <IconButton slot="leading" aria-label="Back">
          <Icon name="arrow_back" />
        </IconButton>
        <Heading slot="headline">Keep it green</Heading>
        <IconButton slot="trailing" aria-label="Edit">
          <Icon name="edit" />
        </IconButton>
      </AppBar>
      <ChipGroup aria-label="Board" className="shrink-0 px-space-300 pt-space-200">
        <Chip id="ideas" variant="assist">
          Ideas
        </Chip>
        <Chip id="shared" variant="assist">
          Shared
        </Chip>
      </ChipGroup>
      <div className="relative h-72 shrink-0">
        <Photo
          of="/theme/shape"
          className="absolute top-space-300 left-space-300 size-52 -rotate-6 rounded-shape-lg shadow-elevation-2"
        />
        <Photo
          of="/theme/spacing"
          className="absolute top-space-800 right-space-300 h-56 w-44 rotate-3 rounded-shape-lg shadow-elevation-2"
        />
      </div>
      <div className="mx-space-300 flex shrink-0 flex-col gap-space-50 rounded-shape-lg bg-tertiary-container p-space-200 text-on-tertiary-container">
        <span className="text-title-lg">To repot</span>
        {plants.map(([plant, isDone]) => (
          <Checkbox key={plant} defaultSelected={isDone}>
            {plant}
          </Checkbox>
        ))}
      </div>
    </Screen>
  )
}
