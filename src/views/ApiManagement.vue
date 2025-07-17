<template>
  <div class="api-management">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>接口管理</span>
          <el-button type="primary" @click="showAddDialog">新增API</el-button>
        </div>
      </template>
      <el-form :model="searchForm" class="search-form" label-position="right" label-width="80px">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-form-item label="模块">
              <el-input v-model="searchForm.module" placeholder="请输入模块" clearable style="width: 100%;"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="一级模块">
              <el-input v-model="searchForm.top_module" placeholder="请输入一级模块" clearable style="width: 100%;"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="子模块">
              <el-input v-model="searchForm.sub_module" placeholder="请输入子模块" clearable style="width: 100%;"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="负责人">
              <el-select v-model="searchForm.developer" placeholder="请选择负责人" clearable filterable style="width: 100%;">
                <el-option v-for="item in developers" :key="item" :label="item" :value="item"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="关联表">
              <el-select v-model="searchForm.related_table" placeholder="请选择关联表" clearable filterable style="width: 100%;">
                <el-option v-for="item in relatedTables" :key="item" :label="item" :value="item"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12" style="text-align: right;">
            <el-form-item>
              <el-button type="primary" @click="handleSearch">查询</el-button>
              <el-button @click="resetSearch">重置</el-button>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <el-table :data="apis" v-loading="loading" style="width: 100%" border>
        <el-table-column prop="id" label="ID" width="60"></el-table-column>
        <el-table-column prop="module" label="模块"></el-table-column>
        <el-table-column prop="top_module" label="一级模块"></el-table-column>
        <el-table-column prop="sub_module" label="子模块"></el-table-column>
        <el-table-column prop="suggestion" label="处理意见" show-overflow-tooltip></el-table-column>
        <el-table-column prop="remark" label="备注" show-overflow-tooltip></el-table-column>
        <el-table-column prop="developer" label="负责人" width="100"></el-table-column>
        <el-table-column prop="progress" label="进度" width="100"></el-table-column>
        <el-table-column prop="related_table" label="关联表" show-overflow-tooltip></el-table-column>
        <el-table-column prop="create_time" label="创建时间" width="160" :formatter="dateTimeFormatter"></el-table-column>
        <el-table-column prop="update_time" label="更新时间" width="160" :formatter="dateTimeFormatter"></el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="scope">
            <el-button type="primary" :icon="Edit" size="small" @click="showEditDialog(scope.row)"></el-button>
            <el-button type="danger" :icon="Delete" size="small" @click="handleDeleteApi(scope.row.id)"></el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-container">
        <el-pagination
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          :current-page="pagination.currentPage"
          :page-sizes="[10, 20, 50, 100]"
          :page-size="pagination.pageSize"
          layout="total, sizes, prev, pager, next, jumper"
          :total="pagination.total"
        />
      </div>
    </el-card>

    <!-- 新增API弹窗 -->
    <el-dialog v-model="addDialogVisible" title="新增API" width="60%" :before-close="handleDialogClose">
      <el-form :model="newApiForm" label-width="100px" ref="newApiFormRef">
        <el-form-item label="模块" prop="module" required>
          <el-input v-model="newApiForm.module" placeholder="请输入模块"></el-input>
        </el-form-item>
        <el-form-item label="一级模块" prop="top_module" required>
          <el-input v-model="newApiForm.top_module" placeholder="请输入一级模块"></el-input>
        </el-form-item>
        <el-form-item label="子模块" prop="sub_module">
          <el-input v-model="newApiForm.sub_module" placeholder="请输入子模块"></el-input>
        </el-form-item>
        <el-form-item label="处理意见" prop="suggestion">
          <el-input v-model="newApiForm.suggestion" type="textarea" placeholder="请输入处理意见"></el-input>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="newApiForm.remark" type="textarea" placeholder="请输入备注"></el-input>
        </el-form-item>
        <el-form-item label="负责人" prop="developer" required>
          <el-select v-model="newApiForm.developer" placeholder="请选择负责人" filterable style="width: 100%;">
            <el-option v-for="item in developers" :key="item" :label="item" :value="item"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="进度" prop="progress">
          <el-input v-model="newApiForm.progress" placeholder="请输入进度"></el-input>
        </el-form-item>
        <el-form-item label="关联表" prop="related_table">
          <el-select v-model="newApiForm.related_table" placeholder="请选择关联表" filterable style="width: 100%;">
            <el-option v-for="item in relatedTables" :key="item" :label="item" :value="item"></el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="addDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleAddApi">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 编辑API弹窗 -->
    <el-dialog v-model="editDialogVisible" title="编辑API" width="60%" :before-close="handleEditDialogClose">
      <el-form :model="editApiForm" label-width="100px" ref="editApiFormRef">
        <el-form-item label="模块" prop="module" required>
          <el-input v-model="editApiForm.module" placeholder="请输入模块"></el-input>
        </el-form-item>
        <el-form-item label="一级模块" prop="top_module" required>
          <el-input v-model="editApiForm.top_module" placeholder="请输入一级模块"></el-input>
        </el-form-item>
        <el-form-item label="子模块" prop="sub_module">
          <el-input v-model="editApiForm.sub_module" placeholder="请输入子模块"></el-input>
        </el-form-item>
        <el-form-item label="处理意见" prop="suggestion">
          <el-input v-model="editApiForm.suggestion" type="textarea" placeholder="请输入处理意见"></el-input>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="editApiForm.remark" type="textarea" placeholder="请输入备注"></el-input>
        </el-form-item>
        <el-form-item label="负责人" prop="developer" required>
          <el-select v-model="editApiForm.developer" placeholder="请选择负责人" filterable style="width: 100%;">
            <el-option v-for="item in developers" :key="item" :label="item" :value="item"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="进度" prop="progress">
          <el-input v-model="editApiForm.progress" placeholder="请输入进度"></el-input>
        </el-form-item>
        <el-form-item label="关联表" prop="related_table">
          <el-select v-model="editApiForm.related_table" placeholder="请选择关联表" filterable style="width: 100%;">
            <el-option v-for="item in relatedTables" :key="item" :label="item" :value="item"></el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="editDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleEditApi">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, toRaw } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Edit, Delete } from '@element-plus/icons-vue'

const apis = ref([])
const loading = ref(false)
const developers = ref([])
const relatedTables = ref([])
const searchForm = reactive({
  module: '',
  top_module: '',
  sub_module: '',
  developer: '',
  related_table: ''
})
const pagination = reactive({
  currentPage: 1,
  pageSize: 20,
  total: 0
})
const addDialogVisible = ref(false)
const newApiForm = reactive({
  module: '',
  top_module: '',
  sub_module: '',
  suggestion: '',
  remark: '',
  developer: '',
  progress: '未开始',
  related_table: ''
})
const newApiFormRef = ref(null)
const editDialogVisible = ref(false)
const editApiForm = reactive({
  id: null,
  module: '',
  top_module: '',
  sub_module: '',
  suggestion: '',
  remark: '',
  developer: '',
  progress: '未开始',
  related_table: ''
})
const editApiFormRef = ref(null)

// 获取 ipcRenderer 实例
const ipcRenderer = window.require ? window.require('electron').ipcRenderer : null;

const fetchApis = async () => {
  if (!ipcRenderer) {
    ElMessage.error('IPC Renderer not available.');
    return;
  }
  loading.value = true
  try {
    const paramsToSend = {
      page: pagination.currentPage,
      pageSize: pagination.pageSize,
      ...searchForm
    }
    const response = await ipcRenderer.invoke('fetch-apis', paramsToSend)
    if (response.success) {
      apis.value = response.data
      pagination.total = response.total
    } else {
      ElMessage.error('获取API信息失败: ' + response.message)
    }
  } catch (error) {
    ElMessage.error('获取API信息时发生错误: ' + error.message)
  } finally {
    loading.value = false
  }
}

const fetchDevelopers = async () => {
  if (!ipcRenderer) {
    ElMessage.error('IPC Renderer not available.');
    return;
  }
  try {
    const response = await ipcRenderer.invoke('fetch-api-developers')
    if (response.success) {
      developers.value = response.data
    } else {
      ElMessage.error('获取负责人失败: ' + response.message)
    }
  } catch (error) {
    ElMessage.error('获取负责人时发生错误: ' + error.message)
  }
}

const fetchRelatedTables = async () => {
  if (!ipcRenderer) {
    ElMessage.error('IPC Renderer not available.');
    return;
  }
  try {
    const response = await ipcRenderer.invoke('fetch-api-related-tables')
    if (response.success) {
      relatedTables.value = response.data
    } else {
      ElMessage.error('获取关联表失败: ' + response.message)
    }
  } catch (error) {
    ElMessage.error('获取关联表时发生错误: ' + error.message)
  }
}

const handleSearch = () => {
  pagination.currentPage = 1
  fetchApis()
}

const resetSearch = () => {
  searchForm.module = ''
  searchForm.top_module = ''
  searchForm.sub_module = ''
  searchForm.developer = ''
  searchForm.related_table = ''
  pagination.currentPage = 1
  fetchApis()
}

const handleSizeChange = (val) => {
  pagination.pageSize = val
  pagination.currentPage = 1
  fetchApis()
}
const handleCurrentChange = (val) => {
  pagination.currentPage = val
  fetchApis()
}

// 日期时间格式化函数
const dateTimeFormatter = (row, column, cellValue) => {
  if (!cellValue) return '';
  const date = new Date(cellValue);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

const showAddDialog = () => {
  resetNewApiForm()
  addDialogVisible.value = true
}
const resetNewApiForm = () => {
  newApiForm.module = ''
  newApiForm.top_module = ''
  newApiForm.sub_module = ''
  newApiForm.suggestion = ''
  newApiForm.remark = ''
  newApiForm.developer = ''
  newApiForm.progress = '未开始'
  newApiForm.related_table = ''
}
const handleAddApi = async () => {
  if (!ipcRenderer) return
  try {
    const paramsToSend = toRaw(newApiForm)
    const response = await ipcRenderer.invoke('create-api', paramsToSend)
    if (response.success) {
      ElMessage.success('新增API成功！')
      addDialogVisible.value = false
      fetchApis()
    } else {
      ElMessage.error('新增API失败: ' + response.message)
    }
  } catch (e) {
    ElMessage.error('新增API时发生错误: ' + e.message)
  }
}
const handleDialogClose = (done) => { done() }

const showEditDialog = (row) => {
  Object.assign(editApiForm, row)
  editDialogVisible.value = true
}
const handleEditApi = async () => {
  if (!ipcRenderer) return
  try {
    const paramsToSend = toRaw(editApiForm)
    const response = await ipcRenderer.invoke('update-api', paramsToSend)
    if (response.success) {
      ElMessage.success('编辑API成功！')
      editDialogVisible.value = false
      fetchApis()
    } else {
      ElMessage.error('编辑API失败: ' + response.message)
    }
  } catch (e) {
    ElMessage.error('编辑API时发生错误: ' + e.message)
  }
}
const handleEditDialogClose = (done) => { done() }

const handleDeleteApi = (id) => {
  if (!ipcRenderer) return
  ElMessageBox.confirm('确定要删除此API吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(async () => {
      try {
        const response = await ipcRenderer.invoke('delete-api', id)
        if (response.success) {
          ElMessage.success('API删除成功！')
          fetchApis()
        } else {
          ElMessage.error('API删除失败: ' + response.message)
        }
      } catch (e) {
        ElMessage.error('API删除时发生错误: ' + e.message)
      }
    })
    .catch(() => {
      ElMessage.info('已取消删除')
    })
}

onMounted(() => {
  fetchDevelopers()
  fetchRelatedTables()
  fetchApis()
})
</script>

<style scoped>
.api-management {
  padding: 20px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.search-form {
  margin-bottom: 20px;
  padding: 15px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  background-color: #ffffff;
}
.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style> 