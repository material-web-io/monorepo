import { Icon } from '@material-web/react'
import type { Api, ApiProp } from '../../plugins/api'
import { Logo } from './logos'

function Prop({
  name,
  type,
  isRequired,
  description,
  default: initial,
  see,
  isDeprecated,
}: ApiProp) {
  return (
    <div className="docs-prop">
      <dt className="docs-prop-term">
        <code className="docs-prop-name">{name}</code>
        {isRequired && <span className="docs-prop-tag">required</span>}
        {isDeprecated && <span className="docs-prop-tag">deprecated</span>}
      </dt>
      <dd className="docs-prop-details">
        <p className="docs-prop-signature">
          <code className="docs-prop-type">{type}</code>
          {initial && (
            <span className="docs-prop-default">
              Default <code>{initial}</code>
            </span>
          )}
        </p>
        {description && (
          <div
            className="docs-prop-description"
            dangerouslySetInnerHTML={{ __html: description }}
          />
        )}
        {see.length > 0 && (
          <p className="docs-prop-see">
            {see.map((url) => {
              // A page of m3.material.io by its tab's name (Overview, Specs, ...) after Material's
              // logo; any other page by its path.
              const { hostname, pathname } = new URL(url)
              const path = pathname.replace(/^\/|\/$/g, '')
              const page = path.split('/').at(-1)?.replaceAll('-', ' ') ?? ''
              const isM3 = hostname === 'm3.material.io'
              return (
                <a key={url} href={url} target="_blank" rel="noreferrer" className="docs-prop-link">
                  {isM3 ? <Logo name="material-design" /> : <Icon name="arrow_outward" />}
                  {isM3
                    ? page.charAt(0).toUpperCase() + page.slice(1)
                    : path.replaceAll('/', ' / ')}
                </a>
              )
            })}
          </p>
        )}
      </dd>
    </div>
  )
}

/**
 * The props of a component, as `virtual:api/<Component>` reads them from its types: the ones
 * the component adds, then the ones of what it is built on, React Aria's where it is theirs.
 */
export function PropsTable({ name, own, inherited, domCount }: Api) {
  return (
    <div className="docs-api">
      {own.length > 0 && (
        <dl className="docs-props">
          {own.map((prop) => (
            <Prop key={prop.name} {...prop} />
          ))}
        </dl>
      )}
      {inherited.length > 0 && (
        <details className="docs-details">
          <summary>
            Props of {name} ({inherited.length})
            <Icon name="expand_more" className="docs-details-icon" />
          </summary>
          <dl className="docs-props">
            {inherited.map((prop) => (
              <Prop key={prop.name} {...prop} />
            ))}
          </dl>
        </details>
      )}
      {domCount > 0 && (
        <p className="docs-api-note">
          {name} also takes the {domCount} attributes and events of the element it renders.
        </p>
      )}
    </div>
  )
}
