import { HeroUIProvider } from '@heroui/system'
import { ToastProvider } from '@heroui/toast'
import { I18nextProvider } from 'react-i18next'

import i18n from '@/utils/i18n'

export function Provider({ children }: { children: React.ReactNode }) {
  return (
    <I18nextProvider i18n={i18n}>
      <HeroUIProvider>
        <ToastProvider />
        {children}
      </HeroUIProvider>
    </I18nextProvider>
  )
}
