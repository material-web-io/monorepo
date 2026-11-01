import { twMerge } from '@material-web/react'

type Swatch = readonly [name: string, className: string]

// The accent roles, row by row: the role, its on color, its container, the container's on color.
const accents: readonly Swatch[] = [
  ['primary', 'min-h-space-700 bg-primary text-on-primary'],
  ['secondary', 'min-h-space-700 bg-secondary text-on-secondary'],
  ['tertiary', 'min-h-space-700 bg-tertiary text-on-tertiary'],
  ['on-primary', 'min-h-space-500 bg-on-primary text-primary'],
  ['on-secondary', 'min-h-space-500 bg-on-secondary text-secondary'],
  ['on-tertiary', 'min-h-space-500 bg-on-tertiary text-tertiary'],
  [
    'primary-container',
    'mt-space-50 min-h-space-700 bg-primary-container text-on-primary-container',
  ],
  [
    'secondary-container',
    'mt-space-50 min-h-space-700 bg-secondary-container text-on-secondary-container',
  ],
  [
    'tertiary-container',
    'mt-space-50 min-h-space-700 bg-tertiary-container text-on-tertiary-container',
  ],
  ['on-primary-container', 'min-h-space-500 bg-on-primary-container text-primary-container'],
  ['on-secondary-container', 'min-h-space-500 bg-on-secondary-container text-secondary-container'],
  ['on-tertiary-container', 'min-h-space-500 bg-on-tertiary-container text-tertiary-container'],
]

const error: readonly Swatch[] = [
  ['error', 'min-h-space-700 bg-error text-on-error'],
  ['on-error', 'min-h-space-500 bg-on-error text-error'],
  ['error-container', 'mt-space-50 min-h-space-700 bg-error-container text-on-error-container'],
  ['on-error-container', 'min-h-space-500 bg-on-error-container text-error-container'],
]

// The fixed roles of each accent: the role beside its dim one, over their two on colors.
const fixed: readonly (readonly [Swatch, Swatch, Swatch, Swatch])[] = [
  [
    ['primary-fixed', 'bg-primary-fixed text-on-primary-fixed'],
    ['primary-fixed-dim', 'bg-primary-fixed-dim text-on-primary-fixed'],
    ['on-primary-fixed', 'bg-on-primary-fixed text-primary-fixed'],
    ['on-primary-fixed-variant', 'bg-on-primary-fixed-variant text-primary-fixed'],
  ],
  [
    ['secondary-fixed', 'bg-secondary-fixed text-on-secondary-fixed'],
    ['secondary-fixed-dim', 'bg-secondary-fixed-dim text-on-secondary-fixed'],
    ['on-secondary-fixed', 'bg-on-secondary-fixed text-secondary-fixed'],
    ['on-secondary-fixed-variant', 'bg-on-secondary-fixed-variant text-secondary-fixed'],
  ],
  [
    ['tertiary-fixed', 'bg-tertiary-fixed text-on-tertiary-fixed'],
    ['tertiary-fixed-dim', 'bg-tertiary-fixed-dim text-on-tertiary-fixed'],
    ['on-tertiary-fixed', 'bg-on-tertiary-fixed text-tertiary-fixed'],
    ['on-tertiary-fixed-variant', 'bg-on-tertiary-fixed-variant text-tertiary-fixed'],
  ],
]

const surfaces: readonly Swatch[] = [
  ['surface-dim', 'bg-surface-dim text-on-surface'],
  ['surface', 'bg-surface text-on-surface'],
  ['surface-bright', 'bg-surface-bright text-on-surface'],
]

const containers: readonly Swatch[] = [
  ['surface-container-lowest', 'bg-surface-container-lowest text-on-surface'],
  ['surface-container-low', 'bg-surface-container-low text-on-surface'],
  ['surface-container', 'bg-surface-container text-on-surface'],
  ['surface-container-high', 'bg-surface-container-high text-on-surface'],
  ['surface-container-highest', 'bg-surface-container-highest text-on-surface'],
]

const onSurfaces: readonly Swatch[] = [
  ['on-surface', 'bg-on-surface text-surface'],
  ['on-surface-variant', 'bg-on-surface-variant text-surface'],
  ['outline', 'bg-outline docs-on-outline'],
  ['outline-variant', 'bg-outline-variant text-on-surface'],
]

const inverse: readonly Swatch[] = [
  ['inverse-surface', 'bg-inverse-surface text-inverse-on-surface'],
  ['inverse-on-surface', 'bg-inverse-on-surface text-inverse-surface'],
  ['inverse-primary', 'mt-space-50 bg-inverse-primary text-on-primary-container'],
]

const overlays: readonly Swatch[] = [
  ['scrim', 'bg-scrim text-white'],
  ['shadow', 'bg-shadow text-white'],
]

// A role's swatch, named as its classes name it: `bg-primary`, `text-on-primary`.
function Role({ swatch: [name, className] }: { swatch: Swatch }) {
  return (
    <div className={twMerge('box-border min-w-0 flex-1 p-space-100 wrap-anywhere', className)}>
      {name}
    </div>
  )
}

const group = 'flex flex-col gap-space-50 large-screen:flex-row large-screen:gap-space-200'
const main = 'min-w-0 large-screen:flex-3'
const side = 'min-w-0 large-screen:flex-1'

export default function ColorRoles() {
  return (
    <div className="box-border flex w-full flex-col gap-space-200 bg-surface-container-low p-space-300 text-label-md medium-screen:p-space-500">
      <div className={group}>
        <div className={twMerge('grid grid-cols-3 gap-x-space-50', main)}>
          {accents.map((swatch) => (
            <Role key={swatch[0]} swatch={swatch} />
          ))}
        </div>
        <div className={twMerge('flex flex-col', side)}>
          {error.map((swatch) => (
            <Role key={swatch[0]} swatch={swatch} />
          ))}
        </div>
      </div>

      <div className={group}>
        <div className={twMerge('grid grid-cols-1 gap-space-50 medium-screen:grid-cols-3', main)}>
          {fixed.map(([role, dim, on, onVariant]) => (
            <div key={role[0]} className="flex min-w-0 flex-col *:min-h-space-450">
              <div className="flex *:min-h-space-700">
                <Role swatch={role} />
                <Role swatch={dim} />
              </div>
              <Role swatch={on} />
              <Role swatch={onVariant} />
            </div>
          ))}
        </div>
        <div className={twMerge('hidden large-screen:block', side)} />
      </div>

      <div className={group}>
        <div className={twMerge('flex flex-col gap-space-50', main)}>
          <div className="flex *:min-h-space-800">
            {surfaces.map((swatch) => (
              <Role key={swatch[0]} swatch={swatch} />
            ))}
          </div>
          <div className="flex flex-col *:min-h-space-500 medium-screen:flex-row medium-screen:*:min-h-space-900">
            {containers.map((swatch) => (
              <Role key={swatch[0]} swatch={swatch} />
            ))}
          </div>
          <div className="flex *:min-h-space-500">
            {onSurfaces.map((swatch) => (
              <Role key={swatch[0]} swatch={swatch} />
            ))}
          </div>
        </div>
        <div className={twMerge('flex flex-col justify-between gap-space-50', side)}>
          <div className="flex flex-col *:min-h-space-500">
            {inverse.map((swatch) => (
              <Role key={swatch[0]} swatch={swatch} />
            ))}
          </div>
          <div className="flex gap-space-200 *:min-h-space-500">
            {overlays.map((swatch) => (
              <Role key={swatch[0]} swatch={swatch} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
