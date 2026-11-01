import { Checkbox, Icon, LinearProgressIndicator } from '@material-web/react'

// The steps of the installation page, by its headings: the last of them is still to do.
const steps = ['Install the library', 'Load the styles and fonts', 'Use the library']
const done = steps.length - 1

/** The picture of the installation: its command, and its steps as far as they are done. */
export default function Install() {
  return (
    <div className="docs-picture-surface flex w-114 flex-col">
      <div className="docs-picture-code flex items-center gap-space-150 bg-surface-container-high px-space-400 py-space-300">
        <Icon name="terminal" className="text-on-surface-variant icon-20" />
        npm install @material-web/react
      </div>
      <div className="flex flex-col gap-space-300 p-space-400">
        <LinearProgressIndicator
          aria-label="Installation"
          shape="wavy"
          value={(done / steps.length) * 100}
        />
        {/* Pulled back by the room around a box, which then starts where the line over it does. */}
        <div className="-ms-2.75 flex flex-col items-start gap-space-100 text-body-lg">
          {steps.map((step, index) => (
            <Checkbox key={step} defaultSelected={index < done}>
              {step}
            </Checkbox>
          ))}
        </div>
      </div>
    </div>
  )
}
