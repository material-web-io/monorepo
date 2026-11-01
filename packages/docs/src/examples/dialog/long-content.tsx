import { Button, Dialog, DialogTrigger } from '@material-web/react'
import { Heading } from 'react-aria-components'

const terms = [
  'These terms cover your use of the service. By creating an account, you agree to them.',
  'You keep the rights to what you upload. You let the service store it and show it to others.',
  'You are responsible for your account. Keep your password to yourself.',
  'We may change the service. When a change affects what you have stored, we tell you first.',
  'You can close your account at any time. What you have stored is deleted 30 days later.',
  'When these terms change, we ask you to accept the new terms before you continue.',
]

export default function LongContent() {
  return (
    <DialogTrigger>
      <Button variant="tonal">Terms of service</Button>
      <Dialog className="max-h-100">
        <Heading
          slot="title"
          className="m-0 px-space-300 pb-space-200 text-headline-sm text-on-surface"
        >
          Terms of service
        </Heading>
        <div className="min-h-0 grow overflow-y-auto px-space-300 pb-space-100">
          {terms.map((term) => (
            <p key={term} className="mt-0 mb-space-200">
              {term}
            </p>
          ))}
        </div>
        <div className="flex shrink-0 flex-wrap-reverse justify-end gap-space-100 px-space-300 pt-space-200">
          <Button variant="text" slot="close">
            Decline
          </Button>
          <Button variant="text" slot="close">
            Accept
          </Button>
        </div>
      </Dialog>
    </DialogTrigger>
  )
}
