import type { Preview } from '@storybook/react-vite'
import { inferControls, normalizeProjectAnnotations } from 'storybook/preview-api'

type ArgTypesEnhancer = NonNullable<Preview['argTypesEnhancers']>[number]

// Each story's argTypes in the order its file writes them, keyed by the story's parameters, taken
// before React's docgen enhancer, which runs between the two below, puts the props it reads first.
const writtenOrder = new WeakMap<object, string[]>()

const recordOrder: ArgTypesEnhancer = ({ argTypes, parameters }) => {
  writtenOrder.set(parameters, Object.keys(argTypes))
  return argTypes
}

// Storybook's own enhancers, which run after every config file's, but inferControls, which keeps
// the order: inferArgTypes moves the args the docgen gives no type to the front. Run here, before
// the order is restored, it types them, and Storybook's own run of it finds nothing to move.
const inferArgTypes = normalizeProjectAnnotations({}).argTypesEnhancers.filter(
  (enhancer) => enhancer !== inferControls,
)

// The written argTypes back in that order, then the ones only the docgen reads, in its order.
const restoreOrder: ArgTypesEnhancer = (context) => {
  const argTypes = inferArgTypes.reduce(
    (inferred, enhancer) => enhancer({ ...context, argTypes: inferred }),
    context.argTypes,
  )
  const keys = new Set([...(writtenOrder.get(context.parameters) ?? []), ...Object.keys(argTypes)])
  return Object.fromEntries(
    [...keys].filter((key) => key in argTypes).map((key) => [key, argTypes[key]]),
  )
}
restoreOrder.secondPass = true

export const argTypesEnhancers = [recordOrder, restoreOrder]
