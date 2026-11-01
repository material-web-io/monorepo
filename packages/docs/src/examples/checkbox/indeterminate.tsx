import { Checkbox } from '@material-web/react'
import { useState } from 'react'

const extras = ['Pickles', 'Tomato', 'Lettuce']

export default function Indeterminate() {
  const [selected, setSelected] = useState(['Tomato'])
  const isAll = selected.length === extras.length
  return (
    <div className="flex flex-col items-start text-body-lg">
      <Checkbox
        isSelected={isAll}
        isIndeterminate={selected.length > 0 && !isAll}
        onChange={(isSelected) => setSelected(isSelected ? extras : [])}
      >
        Additions
      </Checkbox>
      {extras.map((name) => (
        <Checkbox
          key={name}
          className="ps-space-400"
          isSelected={selected.includes(name)}
          onChange={(isSelected) =>
            setSelected(isSelected ? [...selected, name] : selected.filter((it) => it !== name))
          }
        >
          {name}
        </Checkbox>
      ))}
    </div>
  )
}
