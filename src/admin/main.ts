import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import { i18n } from '@shared/i18n'
import App from './App.vue'
import '@shared/styles/main.css'

const router = createRouter({
  history: createWebHistory('/admin/'),
  routes: [
    { path: '/', component: () => import('./views/Overview.vue') },
    { path: '/models', component: () => import('./views/Models.vue') },
    { path: '/models/new', component: () => import('./views/ModelForm.vue') },
    { path: '/models/:id/edit', component: () => import('./views/ModelForm.vue') },
    { path: '/users', component: () => import('./views/Users.vue') },
    { path: '/users/:id', component: () => import('./views/UserDetail.vue') },
  ],
})

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.use(i18n)
app.mount('#app')
