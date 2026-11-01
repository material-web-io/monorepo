import { twMerge } from '@material-web/react'

const layers = [
  ['bg-on-surface/state-hover', 'state-hover', '8%'],
  ['bg-on-surface/state-focus', 'state-focus', '10%'],
  ['bg-on-surface/state-pressed', 'state-pressed', '10%'],
  ['bg-on-surface/state-dragged', 'state-dragged', '16%'],
  ['bg-on-surface/disabled-container', 'disabled-container', '12%'],
  ['bg-on-surface/disabled-content', 'disabled-content', '38%'],
] as const

export default function StateLayers() {
  return (
    <div className="grid w-full grid-cols-2 gap-space-100 medium-screen:grid-cols-3">
      {layers.map(([layer, name, opacity]) => (
        <div key={name} className={twMerge(layer, 'flex flex-col rounded-shape-md p-space-150')}>
          <code className="font-mono text-label-lg">{name}</code>
          <span className="text-label-md text-on-surface-variant">{opacity}</span>
        </div>
      ))}
    </div>
  )
}
