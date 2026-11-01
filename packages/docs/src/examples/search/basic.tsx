import { Icon, IconButton, List, ListItem, SearchField, SearchView } from '@material-web/react'
import { useRef, useState } from 'react'
import { Autocomplete, Input, Text, useFilter } from 'react-aria-components'

const suggestions = [
  ['Peanut butter recipes', 'history'],
  ['Pet adoption', 'history'],
  ['Movie marathon', 'history'],
  ['Weekend hike', 'search'],
  ['Book club', 'search'],
  ['Flight tickets', 'search'],
] as const

export default function Basic() {
  const [query, setQuery] = useState('')
  const [isOpen, setOpen] = useState(false)
  const bar = useRef<HTMLDivElement>(null)
  const { contains } = useFilter({ sensitivity: 'base' })
  return (
    <div className="h-64 w-full pt-space-300">
      <SearchField
        ref={bar}
        aria-label="Search your messages"
        value={query}
        onChange={(value) => {
          setQuery(value)
          setOpen(true)
        }}
        onClick={() => setOpen(true)}
        className="mx-space-300"
      >
        <Icon slot="leading" name="search" />
        <Input placeholder="Search your messages" />
        <IconButton slot="trailing" aria-label="Voice search">
          <Icon name="mic" />
        </IconButton>
      </SearchField>
      <SearchView
        aria-label="Search your messages"
        triggerRef={bar}
        isOpen={isOpen}
        onOpenChange={setOpen}
      >
        {({ state }) => (
          <Autocomplete
            inputValue={query}
            onInputChange={setQuery}
            filter={contains}
            disableAutoFocusFirst
          >
            <SearchField autoFocus aria-label="Search your messages" onSubmit={state.close}>
              <Icon slot="leading" name="search" />
              <IconButton slot="leading" aria-label="Back" onPress={state.close}>
                <Icon name="arrow_back" />
              </IconButton>
              <Input placeholder="Search your messages" />
              <IconButton aria-label="Clear search">
                <Icon name="close" />
              </IconButton>
            </SearchField>
            <List
              aria-label="Suggestions"
              onAction={(key) => {
                setQuery(String(key))
                state.close()
              }}
            >
              {suggestions.map(([label, icon]) => (
                <ListItem key={label} id={label} textValue={label}>
                  <Icon slot="leading" name={icon} />
                  <Text slot="label">{label}</Text>
                </ListItem>
              ))}
            </List>
          </Autocomplete>
        )}
      </SearchView>
    </div>
  )
}
