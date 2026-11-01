import { useState } from 'react'

export default function TouchTarget() {
  const [count, setCount] = useState(0)
  return (
    <div className="flex items-center gap-space-600">
      <button
        type="button"
        aria-label="Add one"
        className="touch-target relative focus-ring size-6 cursor-pointer rounded-shape-full border-0 bg-primary after:rounded-shape-full after:outline after:outline-outline-variant after:outline-dashed"
        onClick={() => setCount(count + 1)}
      />
      <span className="text-body-lg">Pressed {count} times</span>
    </div>
  )
}
