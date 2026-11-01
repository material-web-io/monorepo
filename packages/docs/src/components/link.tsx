import { Button, type ButtonProps } from '@material-web/react'
import { useHref } from 'react-router'
import { useSiteNavigate } from '../leaving'

// A button that is no toggle, as an `<a>`, with the `href` it then has to have.
type LinkProps = Extract<ButtonProps<'a'>, { isSelectable?: false }> & { href: string }

/**
 * A button that is a link to a page of the site: an `<a>`, which a button given `elementType`
 * is, followed through the site's router on a plain click, and by the browser on any other.
 */
export function ButtonLink({ href, ...props }: LinkProps) {
  const navigate = useSiteNavigate()
  return (
    <Button
      {...props}
      elementType="a"
      href={useHref(href)}
      onClick={(event) => {
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
          return
        event.preventDefault()
        navigate(href)
      }}
    />
  )
}
