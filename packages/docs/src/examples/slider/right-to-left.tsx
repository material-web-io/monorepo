import { Icon, Slider } from '@material-web/react'
import { I18nProvider } from 'react-aria-components'

export default function RightToLeft() {
  return (
    <I18nProvider locale="ar-EG">
      <div dir="rtl" className="flex w-80 flex-col gap-space-600">
        <Slider aria-label="Volume" size="m" defaultValue={40} icon={<Icon name="volume_up" />} />
        <Slider aria-label="Price" defaultValue={[30, 70]} showValueIndicator />
      </div>
    </I18nProvider>
  )
}
