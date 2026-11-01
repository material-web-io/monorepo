import { Chip, ChipGroup, Divider, Icon } from '@material-web/react'
import { PhoneTop } from '../components/phone'

const groups = [
  {
    title: 'Amenities',
    icon: 'auto_awesome',
    chips: ['Washer / Dryer', 'Ramp access', 'Garden', 'Cats OK', 'Dogs OK', 'Smoke free'],
    selected: ['Ramp access', 'Cats OK'],
  },
  {
    title: 'Neighborhoods',
    icon: 'map',
    chips: ['Eaglehead', 'Rabbit Island', 'Downtown', 'Harbor'],
    selected: ['Eaglehead', 'Rabbit Island'],
  },
]

/** Filter chips on a search for a home: two groups, some chips of each selected. */
export default function ChipScene() {
  return (
    <PhoneTop>
      {groups.map(({ title, icon, chips, selected }, index) => (
        <div key={title} className="flex shrink-0 flex-col">
          {index > 0 && <Divider />}
          <div className="flex flex-col gap-space-200 px-space-300 py-space-300">
            <span className="flex items-center gap-space-150 text-title-lg icon-24">
              <Icon name={icon} className="text-primary icon-filled" />
              {title}
            </span>
            <ChipGroup aria-label={title} selectionMode="multiple" defaultSelectedKeys={selected}>
              {chips.map((chip) => (
                <Chip key={chip} id={chip} variant="filter" textValue={chip}>
                  {({ isSelected }) => (
                    <>
                      {isSelected && <Icon slot="leading" name="check" />}
                      {chip}
                    </>
                  )}
                </Chip>
              ))}
            </ChipGroup>
          </div>
        </div>
      ))}
    </PhoneTop>
  )
}
