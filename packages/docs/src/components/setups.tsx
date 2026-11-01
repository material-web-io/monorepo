import { Icon, Radio, RadioGroup } from '@material-web/react'
import { createContext, use, useState, type ReactNode } from 'react'

/** A thing a setup may bring with it, and what its tile says of it. */
export type SetupPart = {
  /** What a setup's `includes` names it by. */
  id: string
  /** The Material Symbol on its tile. */
  icon: string
  title: string
  description: string
}

/** A way to set a project up, one of those a page lets its reader choose from. */
export type SetupOption = {
  /** What a `When` names it by. */
  id: string
  title: string
  /** Who it is for, in a sentence: what is shown of it first once it is chosen. */
  audience: string
  /** The parts it brings, by their ids: the others are shown as not included. */
  includes: string[]
  /** What a project needs for it. */
  requires: string[]
}

// The setup chosen in the selector that a part of a page is under.
const Chosen = createContext('')

type SetupsProps = {
  /** The setups to choose from: the first is the one chosen until another is. */
  options: SetupOption[]
  /** Everything a setup may bring, a tile for each under the selector. */
  parts: SetupPart[]
  /** The part of the page under the selector: what it says of every setup, and of some. */
  children: ReactNode
  'aria-label'?: string
  'aria-labelledby'?: string
}

/**
 * A selector of the ways to set a project up, each a radio button whose label is a card. Under
 * it, the one chosen at a glance: who it is for, a tile for each part, marked as included or
 * not, and what it requires. Then the part of the page that depends on it: what a `When`
 * holds is shown for the setups it names.
 */
export function Setups({ options, parts, children, ...props }: SetupsProps) {
  const [chosen, setChosen] = useState(options[0]?.id ?? '')
  const setup = options.find((option) => option.id === chosen)
  return (
    <Chosen value={chosen}>
      <RadioGroup {...props} value={chosen} onChange={setChosen} className="docs-setups">
        {options.map(({ id, title }) => (
          // The card is a grid, which the radio button's label fills: the room around the name
          // is the name's own, so that a press there is one on the label too.
          <Radio key={id} value={id} className="docs-setup grid">
            <span className="docs-setup-text">{title}</span>
          </Radio>
        ))}
      </RadioGroup>
      {setup && (
        <div className="docs-setup-summary">
          <p className="docs-setup-audience">{setup.audience}</p>
          <ul className="docs-setup-parts">
            {parts.map(({ id, icon, title, description }) => {
              const isIncluded = setup.includes.includes(id)
              return (
                <li
                  key={id}
                  className={
                    isIncluded ? 'docs-setup-part docs-setup-part-included' : 'docs-setup-part'
                  }
                >
                  <Icon name={icon} className="icon-32" />
                  <span className="docs-setup-title">{title}</span>
                  <span className="text-body-md">{description}</span>
                  <span className="docs-setup-part-status">
                    <Icon name={isIncluded ? 'check_circle' : 'cancel'} className="icon-20" />
                    {isIncluded ? 'Included' : 'Not included'}
                  </span>
                </li>
              )
            })}
          </ul>
          <p className="docs-setup-requires">
            Requires
            {setup.requires.map((requirement) => (
              <span key={requirement} className="docs-setup-requirement">
                {requirement}
              </span>
            ))}
          </p>
        </div>
      )}
      {children}
    </Chosen>
  )
}

type WhenProps = {
  /** The setups it is shown for, by their ids, a space between them. */
  setup: string
  children: ReactNode
}

/** A part of a page under a selector of setups, shown while one of the setups it names is chosen. */
export function When({ setup, children }: WhenProps) {
  return setup.split(' ').includes(use(Chosen)) ? children : null
}
