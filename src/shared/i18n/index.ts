import { createI18n } from 'vue-i18n'
import en from '../../../locales/en.json'
import zh from '../../../locales/zh.json'

function detectLanguage(): string {
  if (window.location.pathname.startsWith('/zh/') || window.location.pathname.startsWith('/zh')) {
    return 'zh'
  }

  const saved = localStorage.getItem('locale')
  if (saved && ['en', 'zh'].includes(saved)) return saved

  const browserLang = navigator.language?.toLowerCase()
  if (browserLang?.startsWith('zh')) return 'zh'

  return 'en'
}

export const i18n = createI18n({
  legacy: false,
  locale: detectLanguage(),
  fallbackLocale: 'en',
  messages: { en, zh },
})

export function switchLocale(locale: string) {
  if (!['en', 'zh'].includes(locale)) return
  i18n.global.locale.value = locale as any
  localStorage.setItem('locale', locale)
  document.documentElement.lang = locale
}
