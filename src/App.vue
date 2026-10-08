<template>
  <div class="app-container">
    <!-- 全屏背景图层 -->
    <div 
      class="bg-layer" 
      v-if="globalBgUrl"
      :style="{ backgroundImage: `url(${globalBgUrl})`, opacity: globalBgOpacity }"
    ></div>

    <!-- 顶部导航栏区域 -->
    <div class="header-bar">
      <el-menu mode="horizontal" :default-active="activeMenu" @select="handleMenuSelect" class="nav-menu">
        <el-menu-item index="1">床位示意图</el-menu-item>
        <el-menu-item index="2">床位管理</el-menu-item>
      </el-menu>
      
      <div class="right-action">
        <el-button 
          circle 
          size="large"
          @click="settingsVisible = true" 
          icon="Setting" 
          :class="{ 'rotate-anim': settingsVisible }" 
        />
      </div>
    </div>

    <div class="content">
      <Transition name="slide-fade" mode="out-in">
        <component :is="activeMenu === '1' ? BedMap : BedManage" :key="activeMenu" />
      </Transition>
    </div>

    <SettingsDrawer 
      v-model="settingsVisible"
      :current-theme="themeMode"
      :current-bg-url="globalBgUrl"
      :current-bg-opacity="globalBgOpacity"
      @update:theme="handleThemeUpdate"
      @update:bg-url="handleBgUrlUpdate"
      @update:bg-opacity="handleBgOpacityUpdate"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import BedMap from './views/BedMap.vue'
import BedManage from './views/BedManage.vue'
import SettingsDrawer from './components/SettingsDrawer.vue'

const activeMenu = ref('2')
const settingsVisible = ref(false)

const themeMode = ref(localStorage.getItem('themeMode') || 'light')
const globalBgUrl = ref(localStorage.getItem('bgUrl') || '')
const globalBgOpacity = ref(parseFloat(localStorage.getItem('bgOpacity')) || 0.8)

// 🔥 动态监测是否有背景图，如果有，就给 body 加上 has-bg 的类
watch(globalBgUrl, (val) => {
  if (val) {
    document.body.classList.add('has-bg')
  } else {
    document.body.classList.remove('has-bg')
  }
}, { immediate: true })

const applyTheme = (mode) => {
  const htmlEl = document.documentElement
  if (mode === 'dark') {
    htmlEl.classList.add('dark')
  } else if (mode === 'light') {
    htmlEl.classList.remove('dark')
  } else if (mode === 'system') {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    isDark ? htmlEl.classList.add('dark') : htmlEl.classList.remove('dark')
  }
}

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
  if (themeMode.value === 'system') {
    e.matches ? document.documentElement.classList.add('dark') : document.documentElement.classList.remove('dark')
  }
})

const handleThemeUpdate = (val) => {
  themeMode.value = val
  localStorage.setItem('themeMode', val)
  applyTheme(val)
}

const handleBgUrlUpdate = (val) => {
  globalBgUrl.value = val
  localStorage.setItem('bgUrl', val)
}

const handleBgOpacityUpdate = (val) => {
  globalBgOpacity.value = val
  localStorage.setItem('bgOpacity', val)
}

const handleMenuSelect = (index) => {
  activeMenu.value = index
}

onMounted(() => {
  applyTheme(themeMode.value)
})
</script>

<style>
body { margin: 0; background-color: #f5f7fa; font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', Arial, sans-serif; }
html.dark body { background-color: #141414; }

/* 🔥 玻璃特效核心变量：白天与黑夜自动切换 */
:root {
  --glass-bg: rgba(255, 255, 255, 0.45);
  --glass-border: rgba(255, 255, 255, 0.4);
  --glass-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.07);
  --glass-hover: rgba(255, 255, 255, 0.65);
}
html.dark {
  --glass-bg: rgba(20, 20, 20, 0.45);
  --glass-border: rgba(255, 255, 255, 0.1);
  --glass-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
  --glass-hover: rgba(255, 255, 255, 0.1);
}

/* 只有存在背景图时，才应用毛玻璃特效 */
body.has-bg .el-card {
  background: var(--glass-bg) !important;
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid var(--glass-border) !important;
  box-shadow: var(--glass-shadow) !important;
  transition: all 0.3s ease;
}
body.has-bg .el-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.1) !important;
}

/* 无背景图时，保持默认的干净卡片 */
.el-card {
  transition: all 0.3s ease;
}

.bg-layer {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: -1;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  transition: opacity 0.3s ease;
}

.header-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: var(--el-bg-color);
  padding-right: 20px;
  border-bottom: 1px solid var(--el-border-color);
  margin-bottom: 20px;
}
.nav-menu {
  flex: 1;
  border-bottom: none !important;
}
.right-action { flex-shrink: 0; }

.right-action .el-button {
  background-color: var(--el-fill-color-blank);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  color: var(--el-text-color-primary);
  border: 1px solid var(--el-border-color);
}
.right-action .el-button:hover {
  color: #409EFF;
  border-color: #409EFF;
}

.content { padding: 0 20px; position: relative; z-index: 1; }

/* 动画效果 */
.slide-fade-enter-active, .slide-fade-leave-active { transition: all 0.3s cubic-bezier(0.55, 0, 0.1, 1); }
.slide-fade-enter-from { opacity: 0; transform: translateY(20px) scale(0.98); }
.slide-fade-leave-to { opacity: 0; transform: translateY(-20px) scale(0.98); }

.rotate-anim { transform: rotate(180deg); transition: transform 0.5s ease; color: #409EFF; border-color: #409EFF; }

.el-button { transition: transform 0.1s ease, box-shadow 0.2s ease; }
.el-button:active { transform: scale(0.94) !important; }
.el-button:hover { box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); transform: translateY(-1px); }
</style>