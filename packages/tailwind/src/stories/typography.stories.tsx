import type { Meta, StoryObj } from '@storybook/react-vite'

/*
 * Reference pages for the baseline and emphasized type scales: each style is
 * set with its own utility (text-display-lg, text-display-lg-emphasized, ...)
 * and captioned with the spec it should resolve to (size/line height, weight,
 * tracking). Emphasized keeps the baseline size, line height and tracking and
 * only raises the weight. Both pages share one layout. The class names are
 * spelled out in full because Tailwind only generates utilities it finds as
 * literal strings.
 */
type Variant = 'baseline' | 'emphasized'

type Style = {
  /** Text of the sample, as it appears on the reference page. */
  sample: string
  role: string
  size: string
  weight: 'Regular' | 'Medium'
  tracking: string
  classes: string
  emphasizedClasses: string
  emphasizedWeight: 'Medium' | 'Bold'
}

const groups: Style[][] = [
  [
    {
      sample: 'DisplayLarge',
      role: 'Display / Large',
      size: '57/64',
      weight: 'Regular',
      tracking: '-.25',
      classes: 'text-display-lg',
      emphasizedClasses: 'text-display-lg-emphasized',
      emphasizedWeight: 'Medium',
    },
    {
      sample: 'DisplayMedium',
      role: 'Display / Medium',
      size: '45/52',
      weight: 'Regular',
      tracking: '0',
      classes: 'text-display-md',
      emphasizedClasses: 'text-display-md-emphasized',
      emphasizedWeight: 'Medium',
    },
    {
      sample: 'Display Small',
      role: 'Display / Small',
      size: '36/44',
      weight: 'Regular',
      tracking: '0',
      classes: 'text-display-sm',
      emphasizedClasses: 'text-display-sm-emphasized',
      emphasizedWeight: 'Medium',
    },
  ],
  [
    {
      sample: 'Headline Large',
      role: 'Headline / Large',
      size: '32/40',
      weight: 'Regular',
      tracking: '0',
      classes: 'text-headline-lg',
      emphasizedClasses: 'text-headline-lg-emphasized',
      emphasizedWeight: 'Medium',
    },
    {
      sample: 'Headline Medium',
      role: 'Headline / Medium',
      size: '28/36',
      weight: 'Regular',
      tracking: '0',
      classes: 'text-headline-md',
      emphasizedClasses: 'text-headline-md-emphasized',
      emphasizedWeight: 'Medium',
    },
    {
      sample: 'Headline Small',
      role: 'Headline / Small',
      size: '24/32',
      weight: 'Regular',
      tracking: '0',
      classes: 'text-headline-sm',
      emphasizedClasses: 'text-headline-sm-emphasized',
      emphasizedWeight: 'Medium',
    },
  ],
  [
    {
      sample: 'Title Large',
      role: 'Title / Large',
      size: '22/28',
      weight: 'Regular',
      tracking: '0',
      classes: 'text-title-lg',
      emphasizedClasses: 'text-title-lg-emphasized',
      emphasizedWeight: 'Medium',
    },
    {
      sample: 'Title Medium',
      role: 'Title / Medium',
      size: '16/24',
      weight: 'Medium',
      tracking: '+0.15',
      classes: 'text-title-md',
      emphasizedClasses: 'text-title-md-emphasized',
      emphasizedWeight: 'Bold',
    },
    {
      sample: 'Title Small',
      role: 'Title / Small',
      size: '14/20',
      weight: 'Medium',
      tracking: '+0.1',
      classes: 'text-title-sm',
      emphasizedClasses: 'text-title-sm-emphasized',
      emphasizedWeight: 'Bold',
    },
  ],
  [
    {
      sample: 'Label Large',
      role: 'Label / Large',
      size: '14/20',
      weight: 'Medium',
      tracking: '+0.1',
      classes: 'text-label-lg',
      emphasizedClasses: 'text-label-lg-emphasized',
      emphasizedWeight: 'Bold',
    },
    {
      sample: 'Label Medium',
      role: 'Label / Medium',
      size: '12/16',
      weight: 'Medium',
      tracking: '+0.5',
      classes: 'text-label-md',
      emphasizedClasses: 'text-label-md-emphasized',
      emphasizedWeight: 'Bold',
    },
    {
      sample: 'Label Small',
      role: 'Label / Small',
      size: '11/16',
      weight: 'Medium',
      tracking: '+0.5',
      classes: 'text-label-sm',
      emphasizedClasses: 'text-label-sm-emphasized',
      emphasizedWeight: 'Bold',
    },
  ],
  [
    {
      sample: 'Body Large',
      role: 'Body / Large',
      size: '16/24',
      weight: 'Regular',
      tracking: '+0.5',
      classes: 'text-body-lg',
      emphasizedClasses: 'text-body-lg-emphasized',
      emphasizedWeight: 'Medium',
    },
    {
      sample: 'Body Medium',
      role: 'Body / Medium',
      size: '14/20',
      weight: 'Regular',
      tracking: '+0.25',
      classes: 'text-body-md',
      emphasizedClasses: 'text-body-md-emphasized',
      emphasizedWeight: 'Medium',
    },
    {
      sample: 'Body Small',
      role: 'Body / Small',
      size: '12/16',
      weight: 'Regular',
      tracking: '+0.4',
      classes: 'text-body-sm',
      emphasizedClasses: 'text-body-sm-emphasized',
      emphasizedWeight: 'Medium',
    },
  ],
]

function caption(variant: Variant, { role, size, weight, emphasizedWeight, tracking }: Style) {
  const emphasized = variant === 'emphasized'
  return [
    `${role} / ${emphasized ? 'Emphasized' : 'Primary'}`,
    '•',
    'Roboto',
    size,
    emphasized ? emphasizedWeight : weight,
    '100',
    tracking,
  ].join('   ')
}

function Typography({ variant }: { variant: Variant }) {
  const emphasized = variant === 'emphasized'
  return (
    // The page stays light whatever the toolbar theme says, so it uses fixed neutrals, not roles.
    <div className="box-border min-h-screen bg-[#f4f4f4] px-[80px] py-space-500 font-plain text-neutral-10 antialiased">
      <h2 className="m-0 mb-space-800 text-[28px] leading-[36px] font-[400]">
        {emphasized ? 'Emphasis' : 'Baseline'}
      </h2>
      {groups.map((styles) => (
        <section key={styles[0]?.role} className="mb-space-700 flex flex-col gap-space-400">
          {styles.map((style) => (
            <div key={style.role}>
              <div className={emphasized ? style.emphasizedClasses : style.classes}>
                {emphasized ? `${style.sample.replace(' ', '')}Emphasized` : style.sample}
              </div>
              <div className="mt-space-100 font-[ui-monospace,monospace] text-[14px] leading-[20px] whitespace-pre text-[#444]">
                {caption(variant, style)}
              </div>
            </div>
          ))}
        </section>
      ))}
    </div>
  )
}

const meta = {
  title: 'Styles/Typography',
  component: Typography,
  parameters: { layout: 'fullscreen' },
  argTypes: { variant: { table: { category: 'M3' } } },
} satisfies Meta<typeof Typography>

export default meta
type Story = StoryObj<typeof meta>

export const Baseline: Story = { args: { variant: 'baseline' } }
export const Emphasized: Story = { args: { variant: 'emphasized' } }
