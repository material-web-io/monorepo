import { DateField } from '@material-web/react'

export default function Label() {
  return (
    <>
      <DateField label="Date" className="w-52" />
      <DateField label="Date" isRequired className="w-52" />
      <DateField aria-label="Date" className="w-52" />
    </>
  )
}
