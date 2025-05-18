import React from 'react'
import { useTranslation } from 'react-i18next'
import { Select, SelectItem } from '@heroui/select'
import { LazyStore } from '@tauri-apps/plugin-store'

type Props = {
  className?: string
}

const store = new LazyStore('settings.json')
const LANGUAGE_KEY = 'language'

export const LanguageSwitcher: React.FC<Props> = ({ className }) => {
  const { i18n, t } = useTranslation()
  const languages = [
    { key: 'en', label: t('language.options.en') },
    { key: 'fr', label: t('language.options.fr') },
  ]

  const [selectedLanguage, setSelectedLanguage] = React.useState(i18n.language)

  // Charger la langue sauvegardée au démarrage
  React.useEffect(() => {
    store.get<string>(LANGUAGE_KEY).then((lang) => {
      if (lang && lang !== i18n.language) {
        i18n.changeLanguage(lang)
      }
    })
  }, [])

  // Sauvegarder la langue à chaque changement
  const handleSelectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value

    if (selected && selected !== selectedLanguage) {
      setSelectedLanguage(selected)
      i18n.changeLanguage(selected)
      store.set(LANGUAGE_KEY, selected)
      store.save()
    }
  }

  React.useEffect(() => {
    setSelectedLanguage(i18n.language)
  }, [i18n.language])

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
