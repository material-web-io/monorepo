import { Divider, twMerge } from '@material-web/react'
import { Fragment } from 'react'
import { PhoneTop } from '../components/phone'

const groups = [
  {
    title: 'Favorites',
    contacts: [
      ['Ali Connors', 'Mobile', 'bg-primary text-on-primary'],
      ['Sandra Adams', 'Work', 'bg-tertiary text-on-tertiary'],
    ],
  },
  {
    title: 'All contacts',
    contacts: [
      ['Britta Holt', 'Mobile', 'bg-secondary text-on-secondary'],
      ['Jonas Meyer', 'Home', 'bg-primary text-on-primary'],
      ['Mina Park', 'Mobile', 'bg-tertiary text-on-tertiary'],
    ],
  },
] as const

/** Dividers in a list of contacts: inset between its rows, full width between its groups. */
export default function DividerScene() {
  return (
    <PhoneTop>
      <span className="px-space-200 pt-space-200 pb-space-100 text-headline-sm">Contacts</span>
      {groups.map(({ title, contacts }, group) => (
        <Fragment key={title}>
          {group > 0 && <Divider />}
          <span className="px-space-200 pt-space-200 pb-space-50 text-title-sm text-primary">
            {title}
          </span>
          {contacts.map(([name, kind, colors], index) => (
            <Fragment key={name}>
              {index > 0 && <Divider variant="inset" />}
              <div className="flex shrink-0 items-center gap-space-200 px-space-200 py-space-150">
                <span
                  className={twMerge(
                    'grid size-10 shrink-0 place-items-center rounded-full text-title-md',
                    colors,
                  )}
                >
                  {name[0]}
                </span>
                <span className="flex flex-col">
                  <span className="text-body-lg">{name}</span>
                  <span className="text-body-md text-on-surface-variant">{kind}</span>
                </span>
              </div>
            </Fragment>
          ))}
        </Fragment>
      ))}
    </PhoneTop>
  )
}
