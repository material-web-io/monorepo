import { Chip, ChipGroup, Icon } from '@material-web/react'

const sizes = ['Small', 'Medium', 'Large']

export default function Custom() {
  return (
    <ChipGroup
      aria-label="Size"
      selectionMode="single"
      defaultSelectedKeys={['medium']}
      className="density-2"
    >
      {sizes.map((size) => (
        <Chip
          key={size}
          id={size.toLowerCase()}
          variant="filter"
          textValue={size}
          className="rounded-shape-full"
        >
          {({ isSelected }) => (
            <>
              {isSelected && <Icon slot="leading" name="check" />}
              {size}
            </>
          )}
        </Chip>
      ))}
    </ChipGroup>
  )
}
