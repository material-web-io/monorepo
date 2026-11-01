import { Icon, IconButton, twMerge } from '@material-web/react'
import { Screen } from './screen'

// The group's members around its name, each a letter on a color: where, how big and which.
const members = [
  ['M', 'top-0 left-6 size-11', 'bg-tertiary text-on-tertiary'],
  ['A', 'top-1 left-19 size-9', 'bg-primary text-on-primary'],
  ['J', 'top-9 left-12 size-14 text-title-lg', 'bg-tertiary-container text-on-tertiary-container'],
  ['K', 'top-11 left-28 size-10', 'bg-secondary text-on-secondary'],
  ['L', 'top-2 left-31 size-8', 'bg-primary-container text-on-primary-container'],
  ['S', 'top-12 left-0 size-10', 'bg-secondary-container text-on-secondary-container'],
] as const

// Who said what, from the top down: a message of no one's is the reader's own.
const messages = [
  ['June', 'Did anyone finish the last chapter on the train?'],
  [null, 'Just did! That ending though'],
  [null, 'Who brings snacks on Thursday?'],
  ['Ari', 'I can, if someone picks the next book'],
] as const

/** A group chat: its members over its name, then what they said, each in a bubble. */
export default function Chat() {
  return (
    <Screen edge="top" theme="dark">
      {/* The sides as wide as each other, one button or two, so that the group is in the middle
          of the screen, its name too, the menu's arrow hanging after it. */}
      <div className="flex shrink-0 items-start px-space-100 pt-space-100">
        <span className="flex flex-1">
          <IconButton aria-label="Back">
            <Icon name="arrow_back" />
          </IconButton>
        </span>
        <div className="flex flex-col items-center gap-space-100">
          <div className="relative h-25 w-39">
            {members.map(([letter, place, colors]) => (
              <span
                key={letter}
                className={twMerge(
                  'absolute grid place-items-center rounded-full text-title-sm',
                  place,
                  colors,
                )}
              >
                {letter}
              </span>
            ))}
          </div>
          <span className="relative text-title-sm text-on-surface-variant icon-20">
            Book club
            <Icon
              name="expand_more"
              className="absolute top-1/2 left-full ms-space-50 -translate-y-1/2"
            />
          </span>
        </div>
        <span className="flex flex-1 justify-end">
          <IconButton aria-label="Video call">
            <Icon name="videocam" />
          </IconButton>
          <IconButton aria-label="Call">
            <Icon name="call" />
          </IconButton>
        </span>
      </div>
      <div className="mt-space-200 flex grow flex-col gap-space-150 rounded-t-shape-xl bg-surface-container px-space-200 pt-space-300">
        {messages.map(([name, text]) =>
          name ? (
            <div key={text} className="flex flex-col items-start gap-space-50">
              <span className="ps-space-200 text-label-md text-on-surface-variant">{name}</span>
              <span className="max-w-72 rounded-shape-lg bg-primary-container px-space-200 py-space-150 text-body-lg text-on-primary-container">
                {text}
              </span>
            </div>
          ) : (
            <span
              key={text}
              className="max-w-72 self-end rounded-shape-lg bg-tertiary px-space-200 py-space-150 text-body-lg text-on-tertiary"
            >
              {text}
            </span>
          ),
        )}
      </div>
    </Screen>
  )
}
