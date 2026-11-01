import { Button, ButtonGroup } from '@material-web/react'
import { PhoneTop } from '../components/phone'

const views = ['Day', 'Week', 'Month']

const events = [
  ['9:00', 'Design review', 'Room 4'],
  ['11:30', 'Lunch with Sandra', 'Café Lucca'],
  ['14:00', 'Sprint planning', 'Online'],
  ['16:30', 'Dentist', 'Main Street'],
] as const

/** A connected button group across the top of a schedule, which picks the days it shows. */
export default function ButtonGroupScene() {
  return (
    <PhoneTop>
      <span className="px-space-200 pt-space-200 text-headline-sm">Schedule</span>
      <div className="shrink-0 px-space-200 py-space-200">
        <ButtonGroup variant="connected" aria-label="View" defaultSelectedKeys={['Week']}>
          {views.map((view) => (
            <Button key={view} id={view} variant="tonal" isSelectable>
              {view}
            </Button>
          ))}
        </ButtonGroup>
      </div>
      {events.map(([time, title, place]) => (
        <div
          key={time}
          className="flex shrink-0 items-center gap-space-150 px-space-200 py-space-75"
        >
          <span className="w-12 shrink-0 text-label-lg text-on-surface-variant">{time}</span>
          <div className="flex grow flex-col rounded-shape-md bg-secondary-container px-space-200 py-space-150 text-on-secondary-container">
            <span className="text-title-sm">{title}</span>
            <span className="text-body-sm">{place}</span>
          </div>
        </div>
      ))}
    </PhoneTop>
  )
}
