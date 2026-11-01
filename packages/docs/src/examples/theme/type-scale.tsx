import { twMerge } from '@material-web/react'

const styles = [
  ['text-display-lg', 'Display large'],
  ['text-display-md', 'Display medium'],
  ['text-display-sm', 'Display small'],
  ['text-headline-lg', 'Headline large'],
  ['text-headline-md', 'Headline medium'],
  ['text-headline-sm', 'Headline small'],
  ['text-title-lg', 'Title large'],
  ['text-title-md', 'Title medium'],
  ['text-title-sm', 'Title small'],
  ['text-body-lg', 'Body large'],
  ['text-body-md', 'Body medium'],
  ['text-body-sm', 'Body small'],
  ['text-label-lg', 'Label large'],
  ['text-label-md', 'Label medium'],
  ['text-label-sm', 'Label small'],
] as const

export default function TypeScale() {
  return (
    <div className="flex w-full flex-col gap-space-200">
      {styles.map(([style, name]) => (
        <div key={style} className="flex flex-col">
          <span className={twMerge(style, 'truncate')}>{name}</span>
          <code className="font-mono text-label-md tracking-normal text-on-surface-variant">
            {style}
          </code>
        </div>
      ))}
    </div>
  )
}
