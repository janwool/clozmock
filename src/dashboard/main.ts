import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import { i18n } from '@shared/i18n'
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

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.use(i18n)
app.mount('#app')
