import React from 'react'
import { useTranslation } from 'react-i18next'
import { Select, SelectItem } from '@heroui/react'

import { useLanguagePreference } from '@/hooks/useLanguagePreference'

type Props = {
  className?: string
}

export const LanguageSwitcher: React.FC<Props> = ({ className }) => {
  const { t } = useTranslation()
  const { selectedLanguage, changeLanguage } = useLanguagePreference()
  const languages = [
    { key: 'en', label: t('language.options.en') },
    { key: 'fr', label: t('language.options.fr') },
    { key: 'es', label: t('language.options.es') },
    { key: 'de', label: t('language.options.de') },
  ]

  const handleSelectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    changeLanguage(e.target.value)
  }

  return (
    <Select
      className={`${className} w-32`}
      selectedKeys={[selectedLanguage]}
      size="sm"
      onChange={handleSelectionChange}
    >
      {languages.map((lang) => (
        <SelectItem key={lang.key}>{lang.label}</SelectItem>
      ))}
    </Select>
  )
}
