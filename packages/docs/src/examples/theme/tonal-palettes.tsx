import { twMerge } from '@material-web/react'

const tones = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 99, 100]

const palettes = [
  [
    'primary',
    [
      'bg-primary-0',
      'bg-primary-10',
      'bg-primary-20',
      'bg-primary-30',
      'bg-primary-40',
      'bg-primary-50',
      'bg-primary-60',
      'bg-primary-70',
      'bg-primary-80',
      'bg-primary-90',
      'bg-primary-95',
      'bg-primary-99',
      'bg-primary-100',
    ],
  ],
  [
    'secondary',
    [
      'bg-secondary-0',
      'bg-secondary-10',
      'bg-secondary-20',
      'bg-secondary-30',
      'bg-secondary-40',
      'bg-secondary-50',
      'bg-secondary-60',
      'bg-secondary-70',
      'bg-secondary-80',
      'bg-secondary-90',
      'bg-secondary-95',
      'bg-secondary-99',
      'bg-secondary-100',
    ],
  ],
  [
    'tertiary',
    [
      'bg-tertiary-0',
      'bg-tertiary-10',
      'bg-tertiary-20',
      'bg-tertiary-30',
      'bg-tertiary-40',
      'bg-tertiary-50',
      'bg-tertiary-60',
      'bg-tertiary-70',
      'bg-tertiary-80',
      'bg-tertiary-90',
      'bg-tertiary-95',
      'bg-tertiary-99',
      'bg-tertiary-100',
    ],
  ],
  [
    'error',
    [
      'bg-error-0',
      'bg-error-10',
      'bg-error-20',
      'bg-error-30',
      'bg-error-40',
      'bg-error-50',
      'bg-error-60',
      'bg-error-70',
      'bg-error-80',
      'bg-error-90',
      'bg-error-95',
      'bg-error-99',
      'bg-error-100',
    ],
  ],
  [
    'neutral',
    [
      'bg-neutral-0',
      'bg-neutral-10',
      'bg-neutral-20',
      'bg-neutral-30',
      'bg-neutral-40',
      'bg-neutral-50',
      'bg-neutral-60',
      'bg-neutral-70',
      'bg-neutral-80',
      'bg-neutral-90',
      'bg-neutral-95',
      'bg-neutral-99',
      'bg-neutral-100',
    ],
  ],
  [
    'neutral-variant',
    [
      'bg-neutral-variant-0',
      'bg-neutral-variant-10',
      'bg-neutral-variant-20',
      'bg-neutral-variant-30',
      'bg-neutral-variant-40',
      'bg-neutral-variant-50',
      'bg-neutral-variant-60',
      'bg-neutral-variant-70',
      'bg-neutral-variant-80',
      'bg-neutral-variant-90',
      'bg-neutral-variant-95',
      'bg-neutral-variant-99',
      'bg-neutral-variant-100',
    ],
  ],
] as const

export default function TonalPalettes() {
  return (
    <div className="flex w-full flex-col gap-space-150">
      {palettes.map(([name, classes]) => (
        <div key={name} className="flex flex-col gap-space-50">
          <span className="text-label-md text-on-surface-variant">{name}</span>
          <div className="flex overflow-hidden rounded-shape-sm">
            {classes.map((tone, index) => (
              <div
                key={tone}
                className={twMerge(tone, 'h-10 flex-1')}
                title={`${name}-${tones[index]}`}
              />
            ))}
          </div>
        </div>
      ))}
      <div className="flex text-label-sm text-on-surface-variant">
        {tones.map((tone) => (
          <span key={tone} className="flex-1 text-center">
            {tone}
          </span>
        ))}
      </div>
    </div>
  )
}
