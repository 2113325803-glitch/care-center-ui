import { createApp } from 'vue'
import App from './App.vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import axios from 'axios'
// 🔥 引入图标库
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

const app = createApp(App)
axios.defaults.baseURL = '/api'

// 🔥 全局注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(ElementPlus)
app.mount('#app')