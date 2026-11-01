import { Button, Dialog, DialogTrigger, TextField } from '@material-web/react'
import { Heading } from 'react-aria-components'

export default function Form() {
  return (
    <DialogTrigger>
      <Button variant="tonal">Rename</Button>
      <Dialog>
        {({ state }) => (
          <form
            onSubmit={(event) => {
              event.preventDefault()
              state.close()
            }}
          >
            <Heading
              slot="title"
              className="m-0 px-space-300 pb-space-200 text-headline-sm text-on-surface"
            >
              Rename file
            </Heading>
            <div className="min-h-0 grow overflow-y-auto px-space-300 pt-space-100 pb-space-100">
              <TextField
                label="File name"
                name="name"
                variant="outlined"
                defaultValue="Budget 2026"
                className="w-full"
              />
            </div>
            <div className="flex shrink-0 flex-wrap-reverse justify-end gap-space-100 px-space-300 pt-space-200">
              <Button variant="text" slot="close">
                Cancel
              </Button>
              <Button variant="text" type="submit">
                Rename
              </Button>
            </div>
          </form>
        )}
      </Dialog>
    </DialogTrigger>
  )
}
