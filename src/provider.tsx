import { memo } from 'react'
import { HeroUIProvider, ToastProvider } from '@heroui/react'
import { I18nextProvider } from 'react-i18next'

import i18n from '@/utils/i18n'

type ProviderProps = {
  children: React.ReactNode
}

const ProviderComponent: React.FC<ProviderProps> = ({ children }) => {
  return (
    <I18nextProvider i18n={i18n}>
      <HeroUIProvider>
        <ToastProvider />
        {children}
      </HeroUIProvider>
    </I18nextProvider>
  )
}

// Mémorisation du provider pour éviter les re-renders inutiles
export const Provider = memo(ProviderComponent)
Provider.displayName = 'Provider'
