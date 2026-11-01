import { Card, Divider, Icon, IconButton } from '@material-web/react'

export default function IconGrouping() {
  return (
    <Card variant="outlined" className="flex-row">
      <div className="flex p-space-100">
        <IconButton aria-label="Align left">
          <Icon name="format_align_left" />
        </IconButton>
        <IconButton aria-label="Align center">
          <Icon name="format_align_center" />
        </IconButton>
        <IconButton aria-label="Align right">
          <Icon name="format_align_right" />
        </IconButton>
      </div>
      <Divider orientation="vertical" variant="middle-inset" />
      <div className="flex p-space-100">
        <IconButton aria-label="Bold">
          <Icon name="format_bold" />
        </IconButton>
        <IconButton aria-label="Italic">
          <Icon name="format_italic" />
        </IconButton>
      </div>
    </Card>
  )
}
