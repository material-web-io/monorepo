import { twMerge } from '@material-web/react'
import { site } from '../nav'
import { Note } from './mdx'

/** The version of the libraries, labelled as a beta. */
export function Version({ className }: { className?: string }) {
  return (
    <span className={twMerge('docs-version', className)}>
      Version {site.version}
      <span className="docs-beta">Beta</span>
    </span>
  )
}

/** The statement that the libraries are in beta, where the installation page installs them. */
export function BetaNote() {
  return (
    <Note>
      <p className="docs-p">
        <strong>Beta.</strong> Both libraries are in beta, at version {site.version}. Their APIs may
        change between releases until the first stable version.
      </p>
    </Note>
  )
}
