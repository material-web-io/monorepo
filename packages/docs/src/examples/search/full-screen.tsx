import { Icon, IconButton, List, ListItem, SearchField, SearchView } from '@material-web/react'
import { useRef, useState } from 'react'
import { Input } from 'react-aria-components'

const recent = ['Peanut butter recipes', 'Pet adoption', 'Movie marathon']

export default function FullScreen() {
  const [query, setQuery] = useState('')
  const [isOpen, setOpen] = useState(false)
  const bar = useRef<HTMLDivElement>(null)
  return (
    <>
      <SearchField
        ref={bar}
        aria-label="Search your messages"
        value={query}
        onChange={(value) => {
          setQuery(value)
          setOpen(true)
        }}
        onClick={() => setOpen(true)}
        className="w-full"
      >
        <Icon slot="leading" name="search" />
        <Input placeholder="Search your messages" />
      </SearchField>
      <SearchView
        aria-label="Search your messages"
        layout="full-screen"
        triggerRef={bar}
        isOpen={isOpen}
        onOpenChange={setOpen}
      >
        {({ state }) => (
          <>
            <SearchField
              autoFocus
              aria-label="Search your messages"
              value={query}
              onChange={setQuery}
              onSubmit={state.close}
            >
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
              aria-label="Recent searches"
              onAction={(key) => {
                setQuery(String(key))
                state.close()
              }}
            >
              {recent.map((label) => (
                <ListItem key={label} id={label}>
                  {label}
                </ListItem>
              ))}
            </List>
          </>
        )}
      </SearchView>
    </>
  )
}
