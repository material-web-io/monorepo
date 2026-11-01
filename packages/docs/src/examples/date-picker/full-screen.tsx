import { parseDate } from '@internationalized/date'
import {
  AppBar,
  Button,
  DatePickerContent,
  DatePickerHeader,
  DatePickerModeToggle,
  DateRangePicker,
  DateRangePickerCalendar,
  DateRangePickerHeadline,
  DateRangePickerInput,
  Dialog,
  DialogTrigger,
  Icon,
  IconButton,
  type DatePickerRenderProps,
} from '@material-web/react'
import { useState } from 'react'
import { Heading, type DateValue, type RangeValue } from 'react-aria-components'

const parts = ({ displayMode }: DatePickerRenderProps) => (
  <>
    <DatePickerHeader>
      <Heading slot="title">Select dates</Heading>
      <DateRangePickerHeadline>
        {displayMode === 'picker' ? 'Start date – End date' : 'Enter dates'}
      </DateRangePickerHeadline>
      <DatePickerModeToggle
        aria-label={
          displayMode === 'picker' ? 'Switch to text input mode' : 'Switch to calendar mode'
        }
      />
    </DatePickerHeader>
    <DatePickerContent>
      <DateRangePickerCalendar />
      <DateRangePickerInput startLabel="Start date" endLabel="End date" />
    </DatePickerContent>
  </>
)

export default function FullScreen() {
  const [dates, setDates] = useState<RangeValue<DateValue> | null>({
    start: parseDate('2025-08-17'),
    end: parseDate('2025-08-23'),
  })
  const [picked, setPicked] = useState(dates)
  return (
    <DialogTrigger onOpenChange={(isOpen) => isOpen && setPicked(dates)}>
      <Button variant="outlined">
        <Icon name="date_range" />
        {dates ? `${dates.start.toString()} – ${dates.end.toString()}` : 'Pick the dates'}
      </Button>
      <Dialog isFullScreen className="bg-surface-container-high pb-0">
        {({ state }) => (
          <>
            <AppBar className="bg-surface-container-high">
              <IconButton slot="leading" aria-label="Close" onPress={() => state.close()}>
                <Icon name="close" />
              </IconButton>
              <Button
                slot="trailing"
                variant="text"
                isDisabled={!picked}
                onPress={() => {
                  setDates(picked)
                  state.close()
                }}
              >
                Save
              </Button>
            </AppBar>
            <DateRangePicker value={picked} onChange={setPicked} className="w-full">
              {parts}
            </DateRangePicker>
          </>
        )}
      </Dialog>
    </DialogTrigger>
  )
}
