import { BottomSheet, Button, Icon, List, ListItem, SheetTrigger } from '@material-web/react'
import { Text } from 'react-aria-components'

const files = [
  'Budget 2026',
  'Cover letter',
  'Design review',
  'Expenses',
  'Floor plan',
  'Flight tickets',
  'Holiday photos',
  'Invoice 0043',
  'Meeting notes',
  'Moodboard',
  'Onboarding',
  'Packing list',
  'Quarterly report',
  'Recipes',
  'Roadmap',
  'Site survey',
  'Team offsite',
  'Travel budget',
]

export default function Scrolling() {
  return (
    <SheetTrigger>
      <Button variant="tonal">Choose a file</Button>
      <BottomSheet isModal aria-label="Files">
        {({ state }) => (
          <List aria-label="Files" className="overflow-y-auto pb-space-200">
            {files.map((name) => (
              <ListItem
                key={name}
                id={name}
                textValue={name}
                className="bg-transparent"
                onAction={() => state.close()}
              >
                <Icon slot="leading" name="description" />
                <Text slot="label">{name}</Text>
              </ListItem>
            ))}
          </List>
        )}
      </BottomSheet>
    </SheetTrigger>
  )
}
