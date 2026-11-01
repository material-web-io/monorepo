import { Checkbox, Icon, IconButton, SideSheetHeader, twMerge } from '@material-web/react'
import { Heading } from 'react-aria-components'

const products = [
  'bg-tertiary-container',
  'bg-primary-container',
  'bg-surface-container-highest',
  'bg-secondary-container',
  'bg-primary-container',
  'bg-tertiary-container',
]

const filters = [
  ['In stock', true],
  ['On sale', true],
  ['Free delivery', false],
  ['New arrivals', false],
  ['Made locally', false],
] as const

/**
 * A side sheet as it is open, which it only is beside a page: a panel at the side of a
 * tablet's screen, its header over the filters of the products beside it.
 */
export default function SideSheetScene() {
  return (
    // The tablet is as wide as its sheet and its page need: in less room, it runs off the start.
    <div className="-ms-space-100 me-space-300 mt-space-500 flex min-w-0 grow justify-end">
      <div className="docs-device min-w-120 grow flex-row rounded-se-shape-xl-inc border-e-8 border-t-8">
        <div className="flex min-w-0 grow flex-col gap-space-200 p-space-300">
          <span className="text-headline-sm">Chairs</span>
          <div className="grid grid-cols-2 gap-space-150">
            {products.map((product, index) => (
              <span key={index} className={twMerge('aspect-square rounded-shape-lg', product)} />
            ))}
          </div>
        </div>
        <div className="docs-thumbnail-panel w-64 bg-surface-container-low">
          <SideSheetHeader>
            <IconButton aria-label="Back">
              <Icon name="arrow_back" />
            </IconButton>
            <Heading slot="title">Filters</Heading>
            <IconButton aria-label="Close">
              <Icon name="close" />
            </IconButton>
          </SideSheetHeader>
          <div className="flex flex-col items-start px-space-100 pt-space-100 text-body-lg">
            {filters.map(([name, isOn]) => (
              <Checkbox key={name} defaultSelected={isOn} className="h-14 shrink-0">
                <span className="ps-space-50">{name}</span>
              </Checkbox>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
