<template>
  <div class="bed-map-container">
    <el-card class="header-card">
      <div class="header-content">
        <div class="filter-area">
          <span>楼层：</span>
          <el-select v-model="currentFloor" @change="fetchBedMap" style="width: 120px;">
            <el-option label="一层" value="1" />
            <el-option label="二层" value="2" />
          </el-select>
        </div>
        <div class="statistics-area">
          <el-tag type="info">总床位: {{ stats.total }}</el-tag>
          <el-tag type="success">空闲: {{ stats.free }}</el-tag>
          <el-tag type="danger">有人: {{ stats.occupied }}</el-tag>
          <el-tag type="warning">外出: {{ stats.out }}</el-tag>
        </div>
      </div>
    </el-card>

    <el-card class="grid-card" v-loading="loading">
      <div class="room-list">
        <div class="room-item" v-for="room in roomList" :key="room.roomNo">
          <div class="room-title">{{ room.roomNo }}</div>
          <div class="bed-grid">
            <div 
              v-for="bed in room.beds" 
              :key="bed.id" 
              class="bed-box"
              :class="getBedStatusClass(bed.bedStatus)"
            >
              <div class="bed-no">{{ bed.bedNo }}</div>
              <div class="bed-status-text">{{ getBedStatusText(bed.bedStatus) }}</div>
            </div>
          </div>
        </div>
      </div>
      <el-empty v-if="roomList.length === 0" description="当前楼层暂无床位数据" />
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const currentFloor = ref('1')
const stats = ref({ total: 0, free: 0, occupied: 0, out: 0 })
const roomList = ref([])
const loading = ref(false)

const fetchStatistics = async () => {
  try {
    const res = await axios.get('/bed/statistics')
    if (res.data.code === 200) stats.value = res.data.data
  } catch (error) { console.error(error) }
}

const fetchBedMap = async () => {
  loading.value = true
  try {
    const res = await axios.get(`/bed/map?floor=${currentFloor.value}`)
    if (res.data.code === 200) roomList.value = res.data.data
  } catch (error) { console.error(error) } finally { loading.value = false }
}

const getBedStatusClass = (status) => {
  return { 1: 'status-free', 2: 'status-occupied', 3: 'status-out' }[status] || 'status-free'
}
const getBedStatusText = (status) => {
  return { 1: '空闲', 2: '有人', 3: '外出' }[status] || '未知'
}

onMounted(() => {
  fetchStatistics()
  fetchBedMap()
})
</script>

<style scoped>
.bed-map-container { padding: 20px; }
.header-card { margin-bottom: 20px; }
.header-content { display: flex; justify-content: space-between; align-items: center; }
.statistics-area { display: flex; gap: 15px; }
.statistics-area .el-tag { font-size: 14px; padding: 8px 15px; font-weight: bold; }

.grid-card { min-height: 400px; }
.room-list { display: flex; flex-wrap: wrap; gap: 20px; }
.bed-grid { display: flex; flex-wrap: wrap; gap: 15px; }

/* 房间小卡片也使用全局变量，自适应白天黑夜 */
.room-item { 
  border: 1px solid var(--glass-border); 
  border-radius: 8px; 
  padding: 15px; 
  background: var(--glass-bg);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  width: 100%; 
}
.room-title { font-size: 18px; font-weight: bold; margin-bottom: 10px; color: var(--el-text-color-primary); }

.bed-box {
  width: 120px; height: 70px;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  border-radius: 6px; color: white; font-size: 14px; font-weight: bold;
  cursor: pointer; transition: transform 0.2s;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}
.bed-box:hover { transform: scale(1.05); }
.bed-no { font-size: 16px; margin-bottom: 5px; }
.bed-status-text { font-size: 12px; opacity: 0.9; }

.status-free { background-color: #67C23A; }
.status-occupied { background-color: #409EFF; }
.status-out { background-color: #E6A23C; }
</style>