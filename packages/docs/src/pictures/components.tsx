import {
  Button,
  Checkbox,
  Chip,
  ChipGroup,
  CircularProgressIndicator,
  Fab,
  Icon,
  IconButton,
  LoadingIndicator,
  Radio,
  RadioGroup,
  Slider,
} from '@material-web/react'
import { Label, SliderOutput } from 'react-aria-components'

const diets = ['Vegan', 'Organic', 'Local']

/** The picture of the components: a wall of them, each on a tile of its own. */
export default function Components() {
  return (
    <div className="grid w-120 max-w-full grid-cols-6 gap-space-100">
      <div className="docs-picture-tile col-span-4 flex items-center justify-center gap-space-150">
        <Button variant="outlined">Cancel</Button>
        <Button>
          <Icon name="check" />
          Save
        </Button>
      </div>
      <div className="docs-picture-tile col-span-2 flex items-center justify-center">
        <Fab aria-label="Compose">
          <Icon name="edit" />
        </Fab>
      </div>
      <div className="docs-picture-tile col-span-3 flex flex-col items-start text-body-lg">
        <Checkbox defaultSelected>Pickles</Checkbox>
        <Checkbox>Tomato</Checkbox>
      </div>
      <RadioGroup
        aria-label="Ship to"
        defaultValue="home"
        className="docs-picture-tile col-span-3 flex flex-col items-start text-body-lg"
      >
        <Radio value="home">Home</Radio>
        <Radio value="office">Office</Radio>
      </RadioGroup>
      <div className="docs-picture-tile col-span-6">
        <Slider defaultValue={40} className="w-full gap-space-100">
          <div className="flex justify-between px-space-150 text-body-md">
            <Label>Volume</Label>
            <SliderOutput className="text-on-surface-variant" />
          </div>
        </Slider>
      </div>
      <div className="docs-picture-tile col-span-4 flex items-center justify-center">
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
      </div>
      <div className="docs-picture-tile col-span-2 flex items-center justify-center gap-space-200">
        <CircularProgressIndicator aria-label="Refreshing" value={60} />
        <LoadingIndicator aria-label="Loading" />
      </div>
      <div className="docs-picture-tile col-span-6 flex items-center justify-center gap-space-150">
        <IconButton aria-label="Search">
          <Icon name="search" />
        </IconButton>
        <IconButton variant="outlined" aria-label="Bookmark">
          <Icon name="bookmark" />
        </IconButton>
        <IconButton variant="tonal" aria-label="Share">
          <Icon name="share" />
        </IconButton>
        <IconButton variant="filled" aria-label="Send">
          <Icon name="send" />
        </IconButton>
      </div>
    </div>
  )
}
