import {
  Button,
  Icon,
  IconButton,
  List,
  ListItem,
  SheetTrigger,
  SideSheet,
  SideSheetHeader,
} from '@material-web/react'
import { useState } from 'react'
import { Heading, Text } from 'react-aria-components'

const sections = ['Labels', 'Format', 'Last modified']

function Filters() {
  const [section, setSection] = useState<string | null>(null)
  return (
    <>
      <SideSheetHeader>
        {section && (
          <IconButton aria-label="Back" onPress={() => setSection(null)}>
            <Icon name="arrow_back" className="rtl:icon-mirrored" />
          </IconButton>
        )}
        <Heading slot="title">{section ?? 'Filters'}</Heading>
        <IconButton aria-label="Close" slot="close">
          <Icon name="close" />
        </IconButton>
      </SideSheetHeader>
      {section ? (
        <p className="m-0 px-space-300 py-space-200 text-on-surface-variant">
          Choose what to filter by {section.toLowerCase()}.
        </p>
      ) : (
        <List aria-label="Filters" className="grow overflow-y-auto">
          {sections.map((name) => (
            <ListItem
              key={name}
              id={name}
              textValue={name}
              className="bg-transparent"
              onAction={() => setSection(name)}
            >
              <Text slot="label">{name}</Text>
              <Icon slot="trailing" name="chevron_right" className="rtl:icon-mirrored" />
            </ListItem>
          ))}
        </List>
      )}
    </>
  )
}

export default function BackButton() {
  return (
    <SheetTrigger>
      <Button variant="tonal">Filter files</Button>
      <SideSheet isModal>
        <Filters />
      </SideSheet>
    </SheetTrigger>
  )
}
