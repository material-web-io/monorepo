import { buttonStyles } from '@material-web/react'

export default function ButtonStyles() {
  return (
    <label
      className={buttonStyles({
        variant: 'tonal',
        size: 'm',
        className: 'has-[:focus-visible]:focus-indicator',
      })}
    >
      Upload
      <input type="file" className="sr-only" />
    </label>
  )
}
