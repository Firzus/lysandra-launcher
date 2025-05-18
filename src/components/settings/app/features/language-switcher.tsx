import React from 'react'
import { useTranslation } from 'react-i18next'
import { Select, SelectItem } from '@heroui/select'

type Props = {
  className?: string
}

export const LanguageSwitcher: React.FC<Props> = ({ className }) => {
  const { i18n, t } = useTranslation()

  // Liste des langues disponibles
  const languages = [
    { key: 'en', label: t('language.options.en') },
    { key: 'fr', label: t('language.options.fr') },
  ]

  const [selectedLanguage, setSelectedLanguage] = React.useState(i18n.language)

  React.useEffect(() => {
    setSelectedLanguage(i18n.language)
  }, [i18n.language])

  const handleSelectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value

    if (selected && selected !== selectedLanguage) {
      setSelectedLanguage(selected)
      i18n.changeLanguage(selected)
    }
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
