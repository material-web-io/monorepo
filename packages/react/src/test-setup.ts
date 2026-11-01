import '@testing-library/jest-dom/vitest'
import { cleanup, configure } from '@testing-library/react'
import { afterEach } from 'vitest'

// How long `waitFor` and `findBy*` wait for what is sure to come, which they stop waiting for
// as soon as it does: what takes a moment alone can take seconds on a busy machine.
configure({ asyncUtilTimeout: 5000 })

// Vitest runs without globals, so testing-library does not register this itself.
afterEach(cleanup)

// jsdom has no ResizeObserver; React Aria watches a popover's trigger with one. Watching nothing
// is enough: nothing resizes in jsdom.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??= ResizeObserverStub as unknown as typeof ResizeObserver

// Nor the Web Animations API; React Aria waits on an element's animations as an overlay leaves.
// None in jsdom is right: a transition there ends at once.
Element.prototype.getAnimations ??= () => []

// Nor IntersectionObserver, by which React Aria's Sheet sees it has been swiped out of view, which
// nothing is in jsdom.
class IntersectionObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return []
  }
}
globalThis.IntersectionObserver ??=
  IntersectionObserverStub as unknown as typeof IntersectionObserver

// Nor an element's scrollTo, by which React Aria's Sheet slides in, and waits for its scrollend:
// a scroll in jsdom, which has no layout, ends at once.
Element.prototype.scrollTo ??= function (this: Element) {
  queueMicrotask(() => this.dispatchEvent(new Event('scrollend')))
}

// Nor matchMedia, which React Aria's Sheet asks whether motion is reduced: no query matches.
globalThis.matchMedia ??= (query: string) =>
  ({
    matches: false,
    media: query,
    onchange: null,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent: () => false,
  }) as MediaQueryList
