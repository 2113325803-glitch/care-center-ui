<template>
  <el-drawer v-model="visible" title="外观设置" size="350px" :with-header="true">
    <div class="setting-section">
      <h4>主题模式</h4>
      <el-radio-group v-model="themeMode" @change="handleThemeChange">
        <el-radio-button label="light">白天</el-radio-button>
        <el-radio-button label="dark">黑夜</el-radio-button>
        <el-radio-button label="system">跟随系统</el-radio-button>
      </el-radio-group>
    </div>

    <div class="setting-section">
      <h4>自定义壁纸</h4>
      <el-input 
        v-model="bgUrl" 
        placeholder="输入图片URL，回车确认" 
        clearable 
        @keyup.enter="saveBgUrl" 
        @clear="clearBgUrl"
        style="margin-bottom: 10px;" 
      />
      
      <div style="display: flex; gap: 10px; align-items: center;">
        <el-upload
          class="upload-demo"
          action="#"
          :show-file-list="false"
          :before-upload="handleUpload"
          accept="image/*"
        >
          <el-button type="primary">本地上传图片</el-button>
        </el-upload>
        
        <!-- 🔥 新增：清除按钮，带摇头特效 -->
        <el-button type="danger" plain round @click="clearBgUrl" class="hover-shake">清除壁纸</el-button>
      </div>
      <p class="tip">建议图片大小不要超过 2MB，否则会占用过多本地缓存。</p>
    </div>

    <div class="setting-section" v-if="bgUrl">
      <h4>壁纸透明度：{{ Math.round(bgOpacity * 100) }}%</h4>
      <el-slider v-model="bgOpacity" :min="0" :max="1" :step="0.05" />
    </div>
  </el-drawer>
</template>

<script setup>
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  modelValue: Boolean,
  currentTheme: String,
  currentBgUrl: String,
  currentBgOpacity: Number
})
const emit = defineEmits(['update:modelValue', 'update:theme', 'update:bgUrl', 'update:bgOpacity'])

const visible = ref(false)
const themeMode = ref(props.currentTheme || 'light')
const bgUrl = ref(props.currentBgUrl || '')
const bgOpacity = ref(props.currentBgOpacity !== undefined ? props.currentBgOpacity : 0.8)

watch(() => props.modelValue, (val) => { visible.value = val })
watch(visible, (val) => { emit('update:modelValue', val) })
watch(themeMode, (val) => { emit('update:theme', val) })
watch(bgOpacity, (val) => { emit('update:bgOpacity', val) })

const handleThemeChange = (val) => {
  emit('update:theme', val)
}

const saveBgUrl = () => {
  if (bgUrl.value) emit('update:bgUrl', bgUrl.value)
}

// 清除壁纸
const clearBgUrl = () => {
  bgUrl.value = ''
  emit('update:bgUrl', '')
  ElMessage.success('已恢复默认壁纸')
}

const handleUpload = (file) => {
  if (file.size / 1024 / 1024 > 2) {
    ElMessage.warning('图片大小不能超过2MB！')
    return false
  }
  const reader = new FileReader()
  reader.readAsDataURL(file)
  reader.onload = () => {
    bgUrl.value = reader.result
    emit('update:bgUrl', bgUrl.value)
  }
  return false
}
</script>

<style scoped>
.setting-section {
  margin-bottom: 30px;
  border-bottom: 1px dashed #ebeef5;
  padding-bottom: 20px;
}
.setting-section h4 {
  margin: 0 0 15px 0;
  color: #303133;
}
.tip {
  font-size: 12px;
  color: #909399;
  margin-top: 10px;
}

/* 🔥 清除按钮的悬停摇头动画 */
.hover-shake:hover {
  animation: shake 0.4s ease-in-out;
  background-color: #fef0f0;
}
@keyframes shake {
  0% { transform: translateX(0); }
  25% { transform: translateX(-3px) rotate(-3deg); }
  50% { transform: translateX(3px) rotate(3deg); }
  75% { transform: translateX(-2px) rotate(-2deg); }
  100% { transform: translateX(0); }
}
</style>