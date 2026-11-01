import { Card, Divider } from '@material-web/react'

export default function GroupedList() {
  return (
    <Card variant="outlined" className="w-64 py-space-100 text-body-lg text-on-surface">
      <ul aria-label="Mailboxes" className="m-0 list-none p-0">
        <li className="px-space-200 py-space-150">Inbox</li>
        <li className="px-space-200 py-space-150">Starred</li>
      </ul>
      <Divider />
      <ul aria-label="Folders" className="m-0 list-none p-0">
        <li className="px-space-200 py-space-150">Receipts</li>
        <li className="px-space-200 py-space-150">Travel</li>
      </ul>
    </Card>
  )
}
