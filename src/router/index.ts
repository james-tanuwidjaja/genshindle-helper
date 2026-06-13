import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'

// Single-view app today; the router establishes the standard structure and
// leaves room to add routes later. BASE_URL keeps paths correct under the
// /genshindle-helper/ GitHub Pages sub-path.
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
  ],
})

export default router
