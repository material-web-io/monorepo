import type { Meta, StoryObj } from '@storybook/react-vite'
import { twMerge } from '../../../react/src/lib/tv'

/*
 * Reference page for the tonal palettes: one row per palette, one swatch per
 * tone. It uses the real utilities (bg-primary-40, ...), so it doubles as a
 * check that every palette utility exists. The class names are spelled out in
 * full because Tailwind only generates utilities it finds as literal strings.
 */
const tones = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 99, 100]

const palettes = [
  {
    label: 'Primary',
    swatches: [
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
  },
  {
    label: 'Secondary',
    swatches: [
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
  },
  {
    label: 'Tertiary',
    swatches: [
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
  },
  {
    label: 'Error',
    swatches: [
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
  },
  {
    label: 'Neutral',
    // The neutral pair sits below a wider gap.
    gapBefore: true,
    swatches: [
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
  },
  {
    label: 'Neutral Variant',
    short: true,
    swatches: [
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
  },
]

// White numbers up to tone 50, black from tone 60.
const numberColor = (tone: number) => (tone < 60 ? 'text-neutral-100' : 'text-neutral-0')

function TonalPalettes() {
  return (
    <div className="relative mx-auto h-[897.76px] w-[1000px] bg-[#f5f5f5] font-plain text-neutral-10 antialiased">
      <h2 className="absolute top-[36.4px] left-[176.3px] m-0 text-[16px] leading-none font-[500] tracking-[0.22px]">
        Tonal Palettes
      </h2>
      <div className="absolute top-[112.8px] left-0 flex w-full flex-col gap-[20.1px]">
        {palettes.map(({ label, swatches, ...row }) => (
          <div
            key={label}
            className={twMerge(
              'flex',
              'gapBefore' in row ? 'mt-[40.4px]' : '',
              'short' in row ? 'h-[70.5px]' : 'h-[108.85px]',
            )}
          >
            <span className="box-border w-[176.3px] pt-[13.65px] pl-[35.4px] text-[14px] leading-none tracking-[0.31px]">
              {label}
            </span>
            <div className="grid w-[799px] grid-cols-13">
              {swatches.map((swatch, i) => (
                <div
                  key={swatch}
                  className={twMerge(
                    swatch,
                    numberColor(tones[i]!),
                    'pt-[14.2px] pr-[1.5px] text-center text-[16px] leading-none font-[500] tracking-[0.15px]',
                  )}
                >
                  {tones[i]}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const meta = {
  title: 'Styles/Color Guidance/Tonal Palettes',
  component: TonalPalettes,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof TonalPalettes>

export default meta

export const Default: StoryObj<typeof meta> = {}
