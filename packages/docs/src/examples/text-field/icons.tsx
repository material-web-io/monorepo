import { Icon, IconButton, TextField } from '@material-web/react'
import { useState } from 'react'

export default function Icons() {
  const [isShown, setShown] = useState(false)
  const [query, setQuery] = useState('Material')
  return (
    <>
      <TextField
        label="Password"
        type={isShown ? 'text' : 'password'}
        autoComplete="current-password"
        className="w-64"
        leading={<Icon name="lock" />}
        trailing={
          <IconButton
            aria-label={isShown ? 'Hide password' : 'Show password'}
            onPress={() => setShown(!isShown)}
          >
            <Icon name={isShown ? 'visibility_off' : 'visibility'} />
          </IconButton>
        }
      />
      <TextField
        variant="outlined"
        label="Search"
        type="search"
        value={query}
        onChange={setQuery}
        className="w-64"
        leading={<Icon name="search" />}
        trailing={
          query !== '' && (
            <IconButton aria-label="Clear" onPress={() => setQuery('')}>
              <Icon name="cancel" />
            </IconButton>
          )
        }
      />
    </>
  )
}
