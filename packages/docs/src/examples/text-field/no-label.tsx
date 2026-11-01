import { Icon, TextField } from '@material-web/react'

export default function WithoutLabel() {
  return (
    <div className="flex flex-wrap items-end justify-center gap-space-200">
      <div className="flex flex-col gap-space-100">
        <span id="full-name" className="text-body-lg text-on-surface">
          Full name
        </span>
        <TextField
          variant="outlined"
          aria-labelledby="full-name"
          placeholder="Ada Lovelace"
          className="w-64"
        />
      </div>
      <TextField
        type="search"
        aria-label="Search"
        placeholder="Search"
        leading={<Icon name="search" />}
        className="w-64"
      />
    </div>
  )
}
