import { Chip, ChipGroup, Divider, Icon } from '@material-web/react'

const diets = ['Vegan', 'Organic', 'Local', 'Gluten free']

/** A row of filter chips that runs off a screen's side, the first one selected. */
export default function ChipThumbnail() {
  return (
    <div className="docs-thumbnail-screen ms-space-600 h-40 grow basis-0 justify-end gap-space-300 self-start rounded-es-shape-xl border-e-0 border-t-0 ps-space-300 pb-space-400">
      <Divider />
      <ChipGroup
        aria-label="Diet"
        selectionMode="multiple"
        defaultSelectedKeys={['vegan']}
        className="w-max flex-nowrap"
      >
        {diets.map((diet) => (
          <Chip key={diet} id={diet.toLowerCase()} variant="filter" textValue={diet}>
            {({ isSelected }) => (
              <>
                {isSelected && <Icon slot="leading" name="check" />}
                {diet}
              </>
            )}
          </Chip>
        ))}
      </ChipGroup>
    </div>
  )
}
