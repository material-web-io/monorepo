import { Button, Menu, MenuItem, MenuPopover } from '@material-web/react'
import { useState } from 'react'
import { MenuTrigger, type Selection } from 'react-aria-components'

const diets = ['Gluten-free', 'Kosher', 'Nut-free', 'Vegan', 'Vegetarian']

export default function MultiSelect() {
  const [chosen, setChosen] = useState<Selection>(new Set(['Nut-free']))
  const names = chosen === 'all' ? diets : diets.filter((diet) => chosen.has(diet))
  return (
    <MenuTrigger>
      <Button variant="outlined">{names.length ? names.join(', ') : 'Diet'}</Button>
      <MenuPopover>
        <Menu selectionMode="multiple" selectedKeys={chosen} onSelectionChange={setChosen}>
          {diets.map((diet) => (
            <MenuItem key={diet} id={diet}>
              {diet}
            </MenuItem>
          ))}
        </Menu>
      </MenuPopover>
    </MenuTrigger>
  )
}
