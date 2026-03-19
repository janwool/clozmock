# Coding Plan: REQ-001 项目架构与技术栈

## 概述
初始化整个项目的基础架构，包括 Node.js 项目配置、Vite + Vue 3 开发环境、Firebase 初始化、Tailwind CSS 配置、目录结构搭建。

## 前置条件
- Node.js >= 18
- npm 或 pnpm
- Firebase CLI (`npm install -g firebase-tools`)
- Firebase 项目已在 console.firebase.google.com 创建

## 实现步骤

### Step 1: 初始化 Node.js 项目与基础依赖

**目标**: 创建 package.json，安装所有基础依赖

**涉及文件**:
- `package.json` - 新建

**代码变更**:

在项目根目录创建 `package.json`：
```json
{
  "name": "mockdown",
  "version": "1.0.0",
  "description": "3D Mockup Online Design SaaS Platform",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "npm run generate && npm run build:vue",
    "build:vue": "vite build",
    "generate": "node scripts/generate-pages.js",
    "validate": "node scripts/validate-models.js",
    "preview": "vite preview",
    "deploy": "firebase deploy"
  },
  "dependencies": {
    "vue": "^3.5",
    "vue-router": "^4.4",
    "pinia": "^2.2",
    "vue-i18n": "^10",
    "three": "^0.170",
    "firebase": "^11",
    "@lemonsqueezy/lemonsqueezy.js": "^3"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5",
    "vite": "^6",
    "tailwindcss": "^4",
    "@tailwindcss/vite": "^4",
    "ejs": "^3.1",
    "typescript": "^5.6",
    "vue-tsc": "^2"
  }
}
```

**注意事项**: 版本号以当前最新稳定版为准，安装后检查兼容性。

---

### Step 2: 创建项目目录结构

**目标**: 搭建完整的项目目录骨架

**涉及文件**:
- 多个目录 - 新建

**代码变更**:

创建以下目录结构：
```
mockdown/
├── scripts/                      # 构建脚本
├── templates/                    # EJS 模板
│   ├── layouts/                  # 布局模板
│   ├── pages/                    # 页面模板
│   └── partials/                 # 组件片段
├── src/                          # Vue 应用
│   ├── editor/                   # 3D 编辑器入口
│   │   ├── components/           # 编辑器组件
│   │   ├── composables/          # 组合式函数
│   │   ├── stores/               # Pinia stores
│   │   ├── App.vue
│   │   └── main.ts
│   ├── dashboard/                # 用户仪表盘入口
│   │   ├── components/
│   │   ├── views/
│   │   ├── App.vue
│   │   └── main.ts
│   ├── shared/                   # 共享模块
│   │   ├── components/           # 共享 UI 组件
│   │   ├── composables/          # 共享组合式函数
│   │   ├── utils/                # 工具函数
│   │   └── types/                # TypeScript 类型定义
│   └── firebase/                 # Firebase 配置
│       └── index.ts
├── public/                       # 静态资源
│   ├── images/
│   └── fonts/
├── locales/                      # 多语言
│   ├── en.json
│   ├── zh.json
│   ├── en/
│   │   └── models.json
│   └── zh/
│       └── models.json
├── functions/                    # Firebase Cloud Functions
│   ├── src/
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
└── dist/                         # 构建输出（gitignore）
```

---

### Step 3: Vite 配置（多页面 + Vue）

**目标**: 配置 Vite 支持多入口 Vue 应用（编辑器和仪表盘）

**涉及文件**:
- `vite.config.ts` - 新建

**代码变更**:

创建 `vite.config.ts`：
```typescript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@shared': resolve(__dirname, 'src/shared'),
      '@editor': resolve(__dirname, 'src/editor'),
      '@dashboard': resolve(__dirname, 'src/dashboard'),
    },
  },
  build: {
    rollupOptions: {
      input: {
        editor: resolve(__dirname, 'editor.html'),
        dashboard: resolve(__dirname, 'dashboard.html'),
      },
      output: {
        dir: resolve(__dirname, 'dist'),
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
  },
})
```

同时创建 Vue 应用的 HTML 入口文件：

`editor.html`：
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>3D Mockup Editor</title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/editor/main.ts"></script>
</body>
</html>
```

`dashboard.html`：
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Dashboard - 3D Mockup</title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/dashboard/main.ts"></script>
</body>
</html>
```

---

### Step 4: TypeScript 配置

**目标**: 配置 TypeScript 支持 Vue 3 和项目路径别名

**涉及文件**:
- `tsconfig.json` - 新建
- `tsconfig.app.json` - 新建
- `tsconfig.node.json` - 新建
- `env.d.ts` - 新建

**代码变更**:

`tsconfig.json`：
```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}
```

`tsconfig.app.json`：
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "jsx": "preserve",
    "importHelpers": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "sourceMap": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@shared/*": ["src/shared/*"],
      "@editor/*": ["src/editor/*"],
      "@dashboard/*": ["src/dashboard/*"]
    },
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "types": ["vite/client"]
  },
  "include": ["src/**/*.ts", "src/**/*.vue", "env.d.ts"]
}
```

`tsconfig.node.json`：
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "skipLibCheck": true
  },
  "include": ["vite.config.ts", "scripts/**/*.js"]
}
```

`env.d.ts`：
```typescript
/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}
```

---

### Step 5: Tailwind CSS 配置

**目标**: 配置 Tailwind CSS v4

**涉及文件**:
- `src/shared/styles/main.css` - 新建

**代码变更**:

`src/shared/styles/main.css`：
```css
@import "tailwindcss";

@theme {
  /* 品牌色 */
  --color-primary-50: #eff6ff;
  --color-primary-100: #dbeafe;
  --color-primary-200: #bfdbfe;
  --color-primary-300: #93c5fd;
  --color-primary-400: #60a5fa;
  --color-primary-500: #3b82f6;
  --color-primary-600: #2563eb;
  --color-primary-700: #1d4ed8;
  --color-primary-800: #1e40af;
  --color-primary-900: #1e3a8a;

  /* 字体 */
  --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
}
```

---

### Step 6: Firebase 客户端配置

**目标**: 初始化 Firebase 客户端 SDK

**涉及文件**:
- `src/firebase/index.ts` - 新建
- `src/firebase/auth.ts` - 新建
- `src/firebase/firestore.ts` - 新建

**代码变更**:

`src/firebase/index.ts`：
```typescript
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
export default app
```

`src/firebase/auth.ts`：
```typescript
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth'
import { auth } from './index'

const googleProvider = new GoogleAuthProvider()

export const signIn = (email: string, password: string) =>
  signInWithEmailAndPassword(auth, email, password)

export const signUp = (email: string, password: string) =>
  createUserWithEmailAndPassword(auth, email, password)

export const signInWithGoogle = () =>
  signInWithPopup(auth, googleProvider)

export const signOut = () => firebaseSignOut(auth)

export const onAuthChanged = (callback: (user: User | null) => void) =>
  onAuthStateChanged(auth, callback)
```

`src/firebase/firestore.ts`：
```typescript
import { doc, getDoc, setDoc, updateDoc, type DocumentData } from 'firebase/firestore'
import { db } from './index'

export const getUserProfile = async (uid: string) => {
  const docRef = doc(db, 'users', uid)
  const docSnap = await getDoc(docRef)
  return docSnap.exists() ? docSnap.data() : null
}

export const createUserProfile = async (uid: string, data: DocumentData) => {
  const docRef = doc(db, 'users', uid)
  await setDoc(docRef, {
    ...data,
    subscription: { plan: 'free', status: 'active' },
    purchases: [],
    downloads: { today: 0, lastResetDate: new Date().toISOString().split('T')[0] },
    createdAt: new Date(),
  })
}

export const updateUserProfile = async (uid: string, data: Partial<DocumentData>) => {
  const docRef = doc(db, 'users', uid)
  await updateDoc(docRef, data)
}
```

---

### Step 7: 环境变量配置

**目标**: 创建环境变量模板

**涉及文件**:
- `.env.example` - 新建
- `.gitignore` - 新建

**代码变更**:

`.env.example`：
```bash
# Firebase
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

# Lemon Squeezy
VITE_LEMONSQUEEZY_STORE_ID=
VITE_LEMONSQUEEZY_API_KEY=

# App
VITE_APP_URL=http://localhost:5173
```

`.gitignore`：
```
node_modules/
dist/
.env
.env.local
*.log
.DS_Store
functions/node_modules/
functions/lib/
```

---

### Step 8: Firebase Hosting 与 Cloud Functions 初始化

**目标**: 配置 Firebase 部署规则

**涉及文件**:
- `firebase.json` - 新建
- `.firebaserc` - 新建
- `functions/package.json` - 新建
- `functions/tsconfig.json` - 新建
- `functions/src/index.ts` - 新建

**代码变更**:

`firebase.json`：
```json
{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      { "source": "/editor/**", "destination": "/editor.html" },
      { "source": "/dashboard/**", "destination": "/dashboard.html" },
      { "source": "/api/**", "function": "api" }
    ],
    "headers": [
      {
        "source": "**/*.@(js|css)",
        "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }]
      },
      {
        "source": "**/*.html",
        "headers": [{ "key": "Cache-Control", "value": "public, max-age=3600" }]
      }
    ]
  },
  "functions": {
    "source": "functions",
    "runtime": "nodejs20"
  },
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  }
}
```

`functions/package.json`：
```json
{
  "name": "mockdown-functions",
  "version": "1.0.0",
  "main": "lib/index.js",
  "scripts": {
    "build": "tsc",
    "serve": "npm run build && firebase emulators:start --only functions"
  },
  "dependencies": {
    "firebase-admin": "^12",
    "firebase-functions": "^6",
    "@lemonsqueezy/lemonsqueezy.js": "^3",
    "cors": "^2.8"
  },
  "devDependencies": {
    "typescript": "^5.6",
    "@types/cors": "^2.8"
  }
}
```

`functions/tsconfig.json`：
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./lib",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*.ts"]
}
```

`functions/src/index.ts`：
```typescript
import * as admin from 'firebase-admin'

admin.initializeApp()

// Webhook 和 API 端点将在后续 Plan 中实现
export { }
```

---

### Step 9: Firestore 安全规则

**目标**: 配置 Firestore 读写权限规则

**涉及文件**:
- `firestore.rules` - 新建
- `firestore.indexes.json` - 新建

**代码变更**:

`firestore.rules`：
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 用户只能读写自己的数据
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow create: if request.auth != null && request.auth.uid == userId;
      allow update: if request.auth != null && request.auth.uid == userId;
      allow delete: if false;  // 不允许客户端删除
    }

    // 模型数据所有人可读
    match /models/{modelId} {
      allow read: if true;
      allow write: if false;  // 只有 Admin/Cloud Functions 可写
    }
  }
}
```

`firestore.indexes.json`：
```json
{
  "indexes": [],
  "fieldOverrides": []
}
```

---

### Step 10: Vue 应用入口文件骨架

**目标**: 创建编辑器和仪表盘的 Vue 入口文件

**涉及文件**:
- `src/editor/main.ts` - 新建
- `src/editor/App.vue` - 新建
- `src/dashboard/main.ts` - 新建
- `src/dashboard/App.vue` - 新建

**代码变更**:

`src/editor/main.ts`：
```typescript
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import '@shared/styles/main.css'

const app = createApp(App)
app.use(createPinia())
app.mount('#app')
```

`src/editor/App.vue`：
```vue
<template>
  <div class="h-screen w-screen bg-gray-900 text-white flex items-center justify-center">
    <p class="text-xl">3D Mockup Editor — Loading...</p>
  </div>
</template>

<script setup lang="ts">
// 编辑器核心逻辑将在 REQ-003 Plan 中实现
</script>
```

`src/dashboard/main.ts`：
```typescript
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import { createI18n } from 'vue-i18n'
import App from './App.vue'
import '@shared/styles/main.css'

const router = createRouter({
  history: createWebHistory('/dashboard/'),
  routes: [
    { path: '/', component: () => import('./views/Overview.vue') },
    { path: '/profile', component: () => import('./views/Profile.vue') },
    { path: '/subscription', component: () => import('./views/Subscription.vue') },
    { path: '/downloads', component: () => import('./views/Downloads.vue') },
  ],
})

const i18n = createI18n({
  locale: 'en',
  fallbackLocale: 'en',
  messages: {},
})

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.use(i18n)
app.mount('#app')
```

`src/dashboard/App.vue`：
```vue
<template>
  <div class="min-h-screen bg-gray-50">
    <router-view />
  </div>
</template>

<script setup lang="ts">
// 仪表盘核心逻辑将在 REQ-004 Plan 中实现
</script>
```

---

## 验证方式
1. `npm install` 无报错
2. `npm run dev` 可正常启动 Vite 开发服务器
3. 访问 `/editor.html` 和 `/dashboard.html` 能看到 Vue 应用占位页
4. TypeScript 编译无报错 (`npx vue-tsc --noEmit`)

## 风险点
- Tailwind CSS v4 语法与 v3 差异较大，确保 `@import "tailwindcss"` 用法正确
- Firebase 环境变量需用户自行配置
- Vite MPA 模式下的路由 rewrite 需与 Firebase Hosting 配置配合
