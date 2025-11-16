import { createApp } from 'vue'
import './style.css'
import './styles/variables.css'
import './styles/components.css'
import App from './App.vue'
import router from './router'

createApp(App).use(router).mount('#app')
