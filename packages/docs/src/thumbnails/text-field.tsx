import { Icon, IconButton, TextField } from '@material-web/react'

/** Two text fields on a screen: one filled in, with its clear button, and one still empty. */
export default function TextFieldThumbnail() {
  return (
    <div className="docs-thumbnail-screen w-64 justify-center gap-space-250 self-stretch border-y-0 px-space-250">
      <TextField
        variant="outlined"
        label="Name"
        defaultValue="Ali Connors"
        trailing={
          <IconButton aria-label="Clear">
            <Icon name="cancel" />
          </IconButton>
        }
        className="w-full"
      />
      <TextField variant="outlined" label="Email" className="w-full" />
    </div>
  )
}
