import {
  Button,
  Icon,
  IconButton,
  Radio,
  RadioGroup,
  SheetTrigger,
  SideSheet,
  SideSheetHeader,
} from '@material-web/react'
import { Heading } from 'react-aria-components'

export default function Width() {
  return (
    <SheetTrigger>
      <Button variant="tonal">Open settings</Button>
      <SideSheet isModal className="side-sheet-width-90">
        <SideSheetHeader>
          <Heading slot="title">Settings</Heading>
          <IconButton aria-label="Close" slot="close">
            <Icon name="close" />
          </IconButton>
        </SideSheetHeader>
        <RadioGroup
          aria-label="Density"
          defaultValue="default"
          className="flex flex-col items-start px-space-300 py-space-200 text-body-lg"
        >
          {['Default', 'Comfortable', 'Compact'].map((name) => (
            <Radio key={name} className="h-14" value={name.toLowerCase()}>
              {name}
            </Radio>
          ))}
        </RadioGroup>
      </SideSheet>
    </SheetTrigger>
  )
}
