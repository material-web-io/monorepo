import { parseDate } from '@internationalized/date'
import {
  DatePicker,
  DatePickerCalendar,
  DatePickerContent,
  DatePickerHeader,
  DatePickerHeadline,
  DatePickerInput,
  DatePickerModeToggle,
} from '@material-web/react'
import { Heading, I18nProvider } from 'react-aria-components'

export default function Locale() {
  return (
    <I18nProvider locale="fr-FR">
      <DatePicker defaultValue={parseDate('2025-08-17')}>
        {({ displayMode }) => (
          <>
            <DatePickerHeader>
              <Heading slot="title">Sélectionner une date</Heading>
              <DatePickerHeadline>
                {displayMode === 'picker' ? 'Date sélectionnée' : 'Date saisie'}
              </DatePickerHeadline>
              <DatePickerModeToggle
                aria-label={
                  displayMode === 'picker'
                    ? 'Passer à la saisie au clavier'
                    : 'Passer au calendrier'
                }
              />
            </DatePickerHeader>
            <DatePickerContent>
              <DatePickerCalendar />
              <DatePickerInput label="Date" />
            </DatePickerContent>
          </>
        )}
      </DatePicker>
    </I18nProvider>
  )
}
