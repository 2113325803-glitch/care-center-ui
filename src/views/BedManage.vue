<template>
  <div class="bed-manage-container">
    <el-card class="search-card">
      <el-form :inline="true" :model="queryParams">
        <el-form-item label="客户姓名">
          <el-input v-model="queryParams.customerName" placeholder="请输入姓名" clearable />
        </el-form-item>
        <el-form-item label="入住日期">
          <el-date-picker v-model="queryParams.startDate" type="date" placeholder="选择日期" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchDetails">查询</el-button>
        </el-form-item>
      </el-form>

      <el-tabs v-model="activeStatus" @tab-click="handleTabChange">
        <el-tab-pane label="正在使用" name="1"></el-tab-pane>
        <el-tab-pane label="使用历史" name="0"></el-tab-pane>
      </el-tabs>

      <el-table :data="tableData" border style="width: 100%" v-loading="loading" class="transparent-table">
        <el-table-column prop="customerName" label="客户姓名" />
        <el-table-column prop="customerSex" label="性别" width="80">
          <template #default="scope">{{ scope.row.customerSex === 0 ? '男' : '女' }}</template>
        </el-table-column>
        <el-table-column prop="bedDetails" label="床位详情" />
        <el-table-column label="入住日期">
          <template #default="scope">{{ scope.row.startDate ? scope.row.startDate.split('T')[0] : '' }}</template>
        </el-table-column>
        <el-table-column label="结束日期">
          <template #default="scope">{{ scope.row.endDate ? scope.row.endDate.split('T')[0] : '' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="200" v-if="activeStatus === '1'">
          <template #default="scope">
            <el-button size="small" type="warning" @click="openEditDialog(scope.row)">修改</el-button>
            <el-button size="small" type="primary" @click="openSwapDialog(scope.row)">床位调换</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="editDialogVisible" title="修改床位结束时间" width="400px">
      <el-form :model="editForm">
        <el-form-item label="结束时间">
          <el-date-picker v-model="editForm.endDate" type="date" placeholder="选择结束日期" style="width: 100%;" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitEdit">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="swapDialogVisible" title="床位调换" width="450px">
      <el-form :model="swapForm" label-width="100px">
        <el-form-item label="新楼层">
          <el-select v-model="swapForm.newFloor" @change="handleFloorChange" placeholder="请选择楼层" style="width: 100%;">
             <el-option label="一层" value="1" />
             <el-option label="二层" value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="新房间号">
          <el-select v-model="swapForm.newRoomNo" @change="fetchFreeBeds" placeholder="请选择房间" style="width: 100%;">
             <el-option v-for="room in roomOptions" :key="room.roomNo" :label="room.roomNo" :value="room.roomNo" />
          </el-select>
        </el-form-item>
        <el-form-item label="新床位号">
          <el-select v-model="swapForm.newBedId" placeholder="请选择空闲床位" style="width: 100%;">
             <el-option v-for="bed in freeBedOptions" :key="bed.id" :label="bed.bedNo" :value="bed.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="swapDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitSwap">确认调换</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'

const activeStatus = ref('1')
const queryParams = reactive({ customerName: '', startDate: '' })
const tableData = ref([])
const loading = ref(false)

const editDialogVisible = ref(false)
const editForm = reactive({ id: null, endDate: '' })

const swapDialogVisible = ref(false)
const swapForm = reactive({ customerId: null, newFloor: '1', newRoomNo: '', newBedId: null, swapDate: new Date() })
const roomOptions = ref([])
const freeBedOptions = ref([])

const fetchDetails = async () => {
  loading.value = true
  try {
    const params = { status: activeStatus.value }
    if (queryParams.customerName) params.customerName = queryParams.customerName
    if (queryParams.startDate) params.startDate = queryParams.startDate
    const res = await axios.get('/bed/manage/details', { params })
    if (res.data.code === 200) tableData.value = res.data.data
  } catch (error) { console.error(error) } finally { loading.value = false }
}

const handleTabChange = () => { fetchDetails() }

const openEditDialog = (row) => {
  editForm.id = row.id
  editForm.endDate = row.endDate
  editDialogVisible.value = true
}

const submitEdit = async () => {
  try {
    await axios.put('/bed/manage/updateEndTime', editForm)
    ElMessage.success('修改成功')
    editDialogVisible.value = false
    fetchDetails()
  } catch (error) { ElMessage.error('修改失败') }
}

const handleFloorChange = async (floor) => {
  swapForm.newRoomNo = ''
  swapForm.newBedId = null
  freeBedOptions.value = []
  const res = await axios.get(`/bed/map?floor=${floor}`)
  if (res.data.code === 200) roomOptions.value = res.data.data
}

const openSwapDialog = async (row) => {
  swapForm.customerId = row.customerId
  swapForm.newFloor = '1'
  swapForm.newRoomNo = ''
  swapForm.newBedId = null
  freeBedOptions.value = []
  swapDialogVisible.value = true
  await handleFloorChange('1')
}

const fetchFreeBeds = (roomNo) => {
  const room = roomOptions.value.find(r => r.roomNo === roomNo)
  if (room) freeBedOptions.value = room.beds.filter(b => b.bedStatus === 1)
}

const submitSwap = async () => {
  if (!swapForm.newBedId) return ElMessage.warning('请选择新床位')
  try {
    await axios.post('/bed/manage/swap', swapForm)
    ElMessage.success('床位调换成功')
    swapDialogVisible.value = false
    fetchDetails()
  } catch (error) { ElMessage.error(error.response?.data?.msg || '调换失败') }
}

onMounted(() => { fetchDetails() })
</script>

<style scoped>
.search-card { margin-bottom: 20px; }

/* 🔥 表格完全透明化，与毛玻璃底衬融为一体 */
.transparent-table {
  background-color: transparent !important;
}
:deep(.transparent-table tr),
:deep(.transparent-table th.el-table__cell),
:deep(.transparent-table td.el-table__cell) {
  background-color: transparent !important;
  border-color: var(--glass-border) !important;
}
:deep(.transparent-table .el-table__inner-wrapper::before) {
  display: none; /* 去除底部横线 */
}
/* 鼠标悬浮时呈现淡淡的玻璃色，而不是突兀的白色 */
:deep(.transparent-table tbody tr:hover > td.el-table__cell) {
  background-color: var(--glass-hover) !important;
}
</style>