// What the plugins in ../plugins give a page by its import.

declare module '*?example' {
  import type { ComponentType } from 'react'

  export const Component: ComponentType
  export const code: string
  export const html: string
}

declare module 'virtual:api/*' {
  const api: import('../plugins/api').Api
  export default api
}

declare module 'virtual:search' {
  const headings: Record<string, import('../plugins/headings').Heading[]>
  export default headings
}
