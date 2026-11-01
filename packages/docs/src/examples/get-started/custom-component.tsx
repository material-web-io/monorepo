import { tv, type VariantProps } from '@material-web/react'

const badge = tv({
  base: 'rounded-shape-full px-space-100 py-space-25 text-label-md',
  variants: {
    tone: {
      neutral: 'bg-surface-container-highest text-on-surface',
      primary: 'bg-primary text-on-primary',
      error: 'bg-error text-on-error',
    },
  },
  defaultVariants: { tone: 'neutral' },
})

type BadgeProps = VariantProps<typeof badge> & { children: string }

function Badge({ tone, children }: BadgeProps) {
  return <span className={badge({ tone })}>{children}</span>
}

export default function CustomComponent() {
  return (
    <>
      <Badge>Draft</Badge>
      <Badge tone="primary">New</Badge>
      <Badge tone="error">Overdue</Badge>
    </>
  )
}
