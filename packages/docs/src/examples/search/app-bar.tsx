import {
  AppBar,
  Icon,
  IconButton,
  List,
  ListItem,
  SearchField,
  SearchView,
} from '@material-web/react'
import { useState } from 'react'
import { Button, DialogTrigger, Input } from 'react-aria-components'

const recent = ['Peanut butter recipes', 'Pet adoption', 'Movie marathon']

export default function FromAnAppBar() {
  const [query, setQuery] = useState('')
  return (
    <div className="h-64">
      <AppBar className="text-center">
        <IconButton slot="leading" aria-label="Menu">
          <Icon name="menu" />
        </IconButton>
        <DialogTrigger>
          <Button slot="search">
            <Icon slot="leading" name="search" />
            {query || 'Search your messages'}
          </Button>
          <SearchView aria-label="Search your messages">
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
        </DialogTrigger>
        <IconButton slot="trailing" aria-label="Account">
          <Icon name="account_circle" />
        </IconButton>
      </AppBar>
    </div>
  )
}
