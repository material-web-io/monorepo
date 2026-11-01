import { SplitButton, SplitButtonLeading, SplitButtonTrailing } from '@material-web/react'

export default function Disabled() {
  return (
    <>
      <SplitButton>
        <SplitButtonLeading isDisabled>Reply</SplitButtonLeading>
        <SplitButtonTrailing aria-label="More reply options" isDisabled />
      </SplitButton>
      <SplitButton variant="outlined">
        <SplitButtonLeading isDisabled>Reply</SplitButtonLeading>
        <SplitButtonTrailing aria-label="More reply options" isDisabled />
      </SplitButton>
    </>
  )
}
