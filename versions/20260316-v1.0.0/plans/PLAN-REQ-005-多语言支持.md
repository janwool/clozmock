# Coding Plan: REQ-005 多语言支持

## 概述
多语言功能已在 PLAN-REQ-002（静态页面生成）和 PLAN-REQ-003/004（Vue 应用 vue-i18n）中覆盖。本 Plan 补充 Vue 应用的 i18n 配置细节和语言自动检测/切换逻辑。

## 前置条件
- PLAN-REQ-001 完成
- `locales/` 翻译文件已创建（PLAN-REQ-002 Step 2）

## 实现步骤

### Step 1: Vue i18n 配置

**目标**: 配置 vue-i18n 插件，支持编辑器和仪表盘的多语言

**涉及文件**:
- `src/shared/i18n/index.ts` - 新建

**代码变更**:

`src/shared/i18n/index.ts`：
```typescript
import { createI18n } from 'vue-i18n'
import en from '../../../locales/en.json'
import zh from '../../../locales/zh.json'

// 检测用户语言偏好
function detectLanguage(): string {
  // 1. URL 路径检测
  if (window.location.pathname.startsWith('/zh/') || window.location.pathname.startsWith('/zh')) {
    return 'zh'
  }

  // 2. localStorage 存储的偏好
  const saved = localStorage.getItem('locale')
  if (saved && ['en', 'zh'].includes(saved)) return saved

  // 3. 浏览器语言
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
```

---

### Step 2: 更新 Vue 入口文件引用 i18n

**目标**: 在编辑器和仪表盘入口文件中使用统一的 i18n 配置

**涉及文件**:
- `src/editor/main.ts` - 修改
- `src/dashboard/main.ts` - 修改

**代码变更**:

`src/editor/main.ts` 中添加：
```typescript
import { i18n } from '@shared/i18n'
// ...
app.use(i18n)
```

`src/dashboard/main.ts` 中替换原有 i18n 创建代码，改为：
```typescript
import { i18n } from '@shared/i18n'
// ...
app.use(i18n)
```

---

### Step 3: 语言切换组件

**目标**: 创建可在 Vue 应用中使用的语言切换组件

**涉及文件**:
- `src/shared/components/LocaleSwitcher.vue` - 新建

**代码变更**:

`src/shared/components/LocaleSwitcher.vue`：
```vue
<template>
  <div class="locale-switcher">
    <button
      v-for="lang in locales"
      :key="lang.code"
      :class="['locale-btn', { active: currentLocale === lang.code }]"
      @click="switchTo(lang.code)"
    >
      {{ lang.label }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { switchLocale } from '@shared/i18n'

const { locale } = useI18n()
const currentLocale = computed(() => locale.value)

const locales = [
  { code: 'en', label: 'EN' },
  { code: 'zh', label: '中文' },
]

function switchTo(code: string) {
  switchLocale(code)
}
</script>

<style scoped>
.locale-switcher { display: flex; gap: 0.25rem; }
.locale-btn {
  padding: 0.25rem 0.5rem; border: 1px solid #475569; background: transparent;
  color: #94a3b8; border-radius: 4px; cursor: pointer; font-size: 0.8rem;
}
.locale-btn.active { background: #334155; color: white; border-color: #3b82f6; }
</style>
```

---

## 验证方式
1. Vue 应用启动后自动检测浏览器语言
2. 语言切换按钮可切换编辑器/仪表盘的 UI 语言
3. 语言偏好保存到 localStorage，刷新后保持

## 风险点
- 翻译文件需保持 key 同步，缺失的 key 会 fallback 到英文
- 新增语言时需同步更新静态页面生成脚本和 Vue 翻译文件
