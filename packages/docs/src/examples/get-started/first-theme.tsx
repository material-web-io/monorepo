export default function First() {
  return (
    <div className="box-border flex w-80 flex-col gap-space-200 rounded-shape-md bg-surface-container-low p-space-200 font-plain text-on-surface shadow-elevation-1">
      <div className="grid h-40 place-items-center rounded-shape-lg bg-tertiary-container">
        <div className="grid size-24 place-items-center rounded-shape-full bg-on-tertiary-container">
          <div className="size-8 rounded-shape-full bg-tertiary-container" />
        </div>
      </div>
      <div className="px-space-100">
        <div className="text-title-lg">Eye Rhymes</div>
        <div className="text-body-md text-on-surface-variant">Glass & Grace</div>
      </div>
      <button
        type="button"
        className="focus-ring h-14 cursor-pointer rounded-shape-full border-0 bg-primary font-plain text-title-md text-on-primary transition-shape-color-shadow hover:shadow-elevation-1 active:rounded-shape-lg"
      >
        Play
      </button>
    </div>
  )
}
