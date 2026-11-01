import { Chip, ChipGroup, Icon } from '@material-web/react'

const diets = ['Vegan', 'Gluten free', 'Organic', 'Local']

export default function Basic() {
  return (
    <ChipGroup aria-label="Diet" selectionMode="multiple" defaultSelectedKeys={['vegan']}>
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
  )
}
