import { Icon, IconButton, SideSheet, SideSheetHeader } from '@material-web/react'
import { useState } from 'react'
import { Heading } from 'react-aria-components'

export default function Standard() {
  const [isOpen, setOpen] = useState(false)
  return (
    <div className="flex h-96 w-full bg-surface">
      <div className="box-border min-w-0 grow overflow-y-auto p-space-300">
        <div className="flex items-center justify-between pb-space-200">
          <span className="text-title-lg">Cassette Futurism</span>
          <IconButton aria-label="Info" onPress={() => setOpen(!isOpen)}>
            <Icon name="info" />
          </IconButton>
        </div>
        <div className="h-40 rounded-shape-md bg-tertiary-container" />
      </div>
      <SideSheet isOpen={isOpen} onOpenChange={setOpen}>
        <SideSheetHeader>
          <Heading slot="title">Info</Heading>
          <IconButton aria-label="Close" slot="close">
            <Icon name="close" />
          </IconButton>
        </SideSheetHeader>
        <dl className="m-0 grid min-h-0 grow grid-cols-2 content-start gap-space-100 overflow-y-auto px-space-300 py-space-200">
          <dt className="text-on-surface-variant">Artist</dt>
          <dd className="m-0">Various artists</dd>
          <dt className="text-on-surface-variant">Tracks</dt>
          <dd className="m-0">12</dd>
          <dt className="text-on-surface-variant">Length</dt>
          <dd className="m-0">48 min</dd>
        </dl>
      </SideSheet>
    </div>
  )
}
