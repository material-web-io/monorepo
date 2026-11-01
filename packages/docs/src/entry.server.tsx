import { renderToReadableStream } from 'react-dom/server'
import { ServerRouter, type EntryContext } from 'react-router'

// The build is the only server: it renders each page once, whole, into its HTML file.
export default async function handleRequest(
  request: Request,
  status: number,
  headers: Headers,
  context: EntryContext,
) {
  const body = await renderToReadableStream(<ServerRouter context={context} url={request.url} />)
  await body.allReady
  headers.set('Content-Type', 'text/html')
  return new Response(body, { headers, status })
}
