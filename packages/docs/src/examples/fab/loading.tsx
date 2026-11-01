import { Fab, Icon } from '@material-web/react'
import { useState } from 'react'
import { Text } from 'react-aria-components'

export default function Loading() {
  const [isUploading, setUploading] = useState(false)
  const upload = async () => {
    setUploading(true)
    await new Promise((resolve) => setTimeout(resolve, 3000))
    setUploading(false)
  }
  return (
    <Fab isPending={isUploading} onPress={upload}>
      <Icon name="upload" />
      <Text slot="label">Upload</Text>
    </Fab>
  )
}
