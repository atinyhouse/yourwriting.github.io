import { createRouter, createWebHistory } from 'vue-router'
import ChatView from '../views/ChatView.vue'
import StyleLibraryView from '../views/StyleLibraryView.vue'
import SettingsView from '../views/SettingsView.vue'

const routes = [
  {
    path: '/',
    name: 'chat',
    component: ChatView,
    meta: { title: 'AI 对话' }
  },
  {
    path: '/style-library',
    name: 'style-library',
    component: StyleLibraryView,
    meta: { title: '文风库' }
  },
  {
    path: '/settings',
    name: 'settings',
    component: SettingsView,
    meta: { title: '设置' }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// 更新页面标题
router.beforeEach((to, from, next) => {
  document.title = `${to.meta.title} - AI 文风助手` || 'AI 文风助手'
  next()
})

export default router
