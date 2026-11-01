import { Button, ButtonGroup, Icon } from '@material-web/react'

const views = ['Day', 'Week', 'Month']

const formats = [
  ['Bold', 'format_bold'],
  ['Italic', 'format_italic'],
  ['Underline', 'format_underlined'],
] as const

/** A connected group over a standard one, at the corner of a screen. */
export default function ButtonGroupThumbnail() {
  return (
    <div className="docs-thumbnail-screen ms-space-300 h-42 grow basis-0 items-start justify-center gap-space-200 self-end rounded-ss-shape-xl border-e-0 border-b-0 ps-space-250">
      <div className="w-52">
        <ButtonGroup variant="connected" aria-label="View" defaultSelectedKeys={['Week']}>
          {views.map((view) => (
            <Button key={view} id={view} variant="tonal" isSelectable>
              {view}
            </Button>
          ))}
        </ButtonGroup>
      </div>
      <ButtonGroup
        size="m"
        aria-label="Format"
        selectionMode="multiple"
        defaultSelectedKeys={['Italic']}
      >
        {formats.map(([format, icon]) => (
          <Button
            key={format}
            id={format}
            size="m"
            variant="tonal"
            isSelectable
            aria-label={format}
          >
            <Icon name={icon} />
          </Button>
        ))}
      </ButtonGroup>
    </div>
  )
}
