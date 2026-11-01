import { Button, Switch, twMerge } from '@material-web/react'

const roles = [
  'bg-primary',
  'bg-secondary',
  'bg-tertiary',
  'bg-error',
  'bg-primary-container',
  'bg-secondary-container',
  'bg-tertiary-container',
  'bg-error-container',
]

// One scheme of the theme, set on the element that holds it: type, color roles and components.
function Scheme({ theme, name }: { theme: 'light' | 'dark'; name: string }) {
  return (
    <div
      data-theme={theme}
      className="flex flex-1 flex-col items-start gap-space-300 bg-surface p-space-400 text-on-surface"
    >
      <span className="text-label-lg text-on-surface-variant">{name}</span>
      <span className="font-brand text-display-md">Aa</span>
      <div className="grid grid-cols-4 gap-space-150">
        {roles.map((role) => (
          <span key={role} className={twMerge(role, 'size-8 rounded-full')} />
        ))}
      </div>
      <div className="flex items-center gap-space-200">
        <Button>Action</Button>
        <Switch aria-label={name} defaultSelected />
      </div>
    </div>
  )
}

/** The picture of the theme: the same few things in its light scheme and in its dark one. */
export default function Theme() {
  return (
    <div className="docs-picture-surface flex">
      <Scheme theme="light" name="Light" />
      <Scheme theme="dark" name="Dark" />
    </div>
  )
}
