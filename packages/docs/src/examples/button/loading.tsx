import { Button } from '@material-web/react'
import { useState } from 'react'

export default function Loading() {
  const [isSaving, setSaving] = useState(false)
  const [isFollowing, setFollowing] = useState(false)
  const [isFollowPending, setFollowPending] = useState(false)
  const save = async () => {
    setSaving(true)
    await new Promise((resolve) => setTimeout(resolve, 3000))
    setSaving(false)
  }
  const follow = async (isSelected: boolean) => {
    setFollowPending(true)
    await new Promise((resolve) => setTimeout(resolve, 3000))
    setFollowing(isSelected)
    setFollowPending(false)
  }
  return (
    <>
      <Button size="m" isPending={isSaving} onPress={save}>
        Save
      </Button>
      <Button
        size="m"
        isSelectable
        isSelected={isFollowing}
        isPending={isFollowPending}
        onChange={follow}
      >
        Follow
      </Button>
    </>
  )
}
