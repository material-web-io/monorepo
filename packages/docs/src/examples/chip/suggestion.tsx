import { Chip, ChipGroup } from '@material-web/react'
import { useState } from 'react'
import type { Key } from 'react-aria-components'

const questions = ['What song is this?', 'What are the lyrics?', 'Who is the artist?']

export default function Suggestion() {
  const [asked, setAsked] = useState<Key>()
  return (
    <div className="flex w-full max-w-96 flex-col gap-space-200">
      <ChipGroup aria-label="Suggestions" onAction={setAsked}>
        {questions.map((question) => (
          <Chip key={question} id={question} variant="suggestion">
            {question}
          </Chip>
        ))}
      </ChipGroup>
      <p className="m-0 text-body-md text-on-surface-variant">
        {asked ? `Asked: ${asked}` : 'Nothing asked yet'}
      </p>
    </div>
  )
}
