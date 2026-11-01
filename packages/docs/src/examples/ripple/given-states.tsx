import { Icon, Ripple } from '@material-web/react'
import { ToggleButton } from 'react-aria-components'

export default function GivenStates() {
  return (
    <ToggleButton className="focus-ring flex cursor-pointer items-center gap-space-50 rounded-shape-full border-0 bg-transparent p-0 pe-space-200 text-label-lg text-on-surface outline-none">
      {({ isSelected, isHovered, isFocusVisible, isDisabled }) => (
        <>
          <span className="pointer-events-none relative grid size-10 place-items-center rounded-full icon-24">
            <Ripple isHovered={isHovered} isFocusVisible={isFocusVisible} isDisabled={isDisabled} />
            <Icon name="favorite" className={isSelected ? 'icon-filled' : undefined} />
          </span>
          Favorite
        </>
      )}
    </ToggleButton>
  )
}
