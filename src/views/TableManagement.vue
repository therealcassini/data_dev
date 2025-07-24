<template>
  <div class="table-management">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>表管理</span>
          <el-button type="primary" @click="showAddDialog">新增表</el-button>
        </div>
      </template>
      <el-form :model="searchForm" class="search-form" label-position="right" label-width="80px">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="表名称">
              <el-input v-model="searchForm.tbl" placeholder="请输入表名称" clearable style="width: 100%;"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="表描述">
              <el-input v-model="searchForm.tbl_desc" placeholder="请输入表描述" clearable style="width: 100%;"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="负责人">
              <el-select v-model="searchForm.owner" placeholder="请选择负责人" clearable filterable style="width: 100%;">
                <el-option v-for="item in owners" :key="item" :label="item" :value="item"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="24" style="text-align: right;">
            <el-form-item>
              <el-button type="primary" @click="handleSearch">查询</el-button>
              <el-button @click="resetSearch">重置</el-button>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <el-table :data="tables" v-loading="loading" style="width: 100%" border>
        <!-- <el-table-column prop="id" label="ID" width="80"></el-table-column> -->
        <el-table-column prop="db_tbl" label="数据库.表名"></el-table-column>
        <el-table-column prop="db" label="数据库"></el-table-column>
        <el-table-column prop="tbl" label="表名"></el-table-column>
        <el-table-column prop="create_sql_name" label="建表SQL名称"></el-table-column>
        <el-table-column prop="insert_sql_name" label="插入SQL名称"></el-table-column>
        <el-table-column prop="tbl_desc" label="表描述" show-overflow-tooltip></el-table-column>
        <el-table-column prop="owner" label="负责人" width="100"></el-table-column>
        <el-table-column prop="related_table" label="关联表" show-overflow-tooltip>
          <template #default="scope">
            <div class="copyable" @click="copyToClipboard(scope.row.related_table.join(','))">
              {{ scope.row.related_table.join(',') }}
            </div>
          </template>
        </el-table-column>
        <!-- <el-table-column prop="create_time" label="创建时间" width="160" :formatter="dateTimeFormatter"></el-table-column> -->
        <el-table-column prop="update_time" label="更新时间" width="160" :formatter="dateTimeFormatter"></el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="scope">
            <el-button
              type="primary"
              :icon="Edit"
              size="small"
              @click="showEditDialog(scope.row)"
            ></el-button>
            <el-button
              type="danger"
              :icon="Delete"
              size="small"
              @click="handleDeleteTable(scope.row.id)"
            ></el-button>
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

    <!-- 新增表弹窗 -->
    <el-dialog
      v-model="addDialogVisible"
      title="新增表"
      width="60%"
      :before-close="handleDialogClose"
    >
      <el-form :model="newTableForm" label-width="100px" ref="newTableFormRef">
        <el-form-item label="数据库" prop="db" required>
          <el-select v-model="newTableForm.db" placeholder="请选择数据库" style="width: 100%;">
            <el-option v-for="item in dbOptions" :key="item" :label="item" :value="item"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="表名" prop="tbl" required>
          <el-input v-model="newTableForm.tbl" placeholder="请输入表名"></el-input>
        </el-form-item>
        <el-form-item label="建表SQL名称" prop="create_sql_name">
          <el-select v-model="newTableForm.create_sql_name" filterable remote reserve-keyword placeholder="请选择建表SQL名称" :remote-method="fetchSqlNames" style="width: 100%;" @change="onCreateSqlNameChange">
            <el-option v-for="item in sqlNames" :key="item" :label="item" :value="item"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="建表SQL" prop="create_sql">
          <el-input v-model="newTableForm.create_sql" type="textarea" placeholder="建表SQL内容" :rows="4"></el-input>
        </el-form-item>
        <el-form-item label="插入SQL名称" prop="insert_sql_name">
          <el-select v-model="newTableForm.insert_sql_name" filterable remote reserve-keyword placeholder="请选择插入SQL名称" :remote-method="fetchSqlNames" style="width: 100%;" @change="onInsertSqlNameChange">
            <el-option v-for="item in sqlNames" :key="item" :label="item" :value="item"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="插入SQL" prop="insert_sql">
          <el-input v-model="newTableForm.insert_sql" type="textarea" placeholder="插入SQL内容" :rows="4"></el-input>
        </el-form-item>
        <el-form-item label="表描述" prop="tbl_desc">
          <el-input v-model="newTableForm.tbl_desc" placeholder="请输入表描述"></el-input>
        </el-form-item>
        <el-form-item label="负责人" prop="owner">
          <el-select v-model="newTableForm.owner" placeholder="请选择负责人" filterable style="width: 100%;">
            <el-option v-for="item in owners" :key="item" :label="item" :value="item"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="关联表" prop="related_table">
          <el-select v-model="newTableForm.related_table" placeholder="请选择关联表" filterable multiple style="width: 100%;">
            <el-option v-for="item in relatedTables" :key="item" :label="item" :value="item"></el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="addDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleAddTable">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 编辑表弹窗 -->
    <el-dialog
      v-model="editDialogVisible"
      title="编辑表"
      width="60%"
      :before-close="handleEditDialogClose"
    >
      <el-form :model="editTableForm" label-width="100px" ref="editTableFormRef">
        <el-form-item label="数据库" prop="db" required>
          <el-select v-model="editTableForm.db" placeholder="请选择数据库" style="width: 100%;">
            <el-option v-for="item in dbOptions" :key="item" :label="item" :value="item"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="表名" prop="tbl" required>
          <el-input v-model="editTableForm.tbl" placeholder="请输入表名"></el-input>
        </el-form-item>
        <el-form-item label="建表SQL名称" prop="create_sql_name">
          <el-select v-model="editTableForm.create_sql_name" filterable remote reserve-keyword placeholder="请选择建表SQL名称" :remote-method="fetchSqlNames" style="width: 100%;" @change="onEditCreateSqlNameChange">
            <el-option v-for="item in sqlNames" :key="item" :label="item" :value="item"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="建表SQL" prop="create_sql">
          <el-input v-model="editTableForm.create_sql" type="textarea" placeholder="建表SQL内容" :rows="4"></el-input>
        </el-form-item>
        <el-form-item label="插入SQL名称" prop="insert_sql_name">
          <el-select v-model="editTableForm.insert_sql_name" filterable remote reserve-keyword placeholder="请选择插入SQL名称" :remote-method="fetchSqlNames" style="width: 100%;" @change="onEditInsertSqlNameChange">
            <el-option v-for="item in sqlNames" :key="item" :label="item" :value="item"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="插入SQL" prop="insert_sql">
          <el-input v-model="editTableForm.insert_sql" type="textarea" placeholder="插入SQL内容" :rows="4"></el-input>
        </el-form-item>
        <el-form-item label="表描述" prop="tbl_desc">
          <el-input v-model="editTableForm.tbl_desc" placeholder="请输入表描述"></el-input>
        </el-form-item>
        <el-form-item label="负责人" prop="owner">
          <el-select v-model="editTableForm.owner" placeholder="请选择负责人" filterable style="width: 100%;">
            <el-option v-for="item in owners" :key="item" :label="item" :value="item"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="关联表" prop="related_table">
          <el-select v-model="editTableForm.related_table" placeholder="请选择关联表" filterable multiple style="width: 100%;">
            <el-option v-for="item in relatedTables" :key="item" :label="item" :value="item"></el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="editDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleEditTable">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, toRaw } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Edit, Delete } from '@element-plus/icons-vue'

const tables = ref([])
const loading = ref(false)
const owners = ref([])
const searchForm = reactive({
  tbl: '',
  tbl_desc: '',
  owner: ''
})
const pagination = reactive({
  currentPage: 1,
  pageSize: 20,
  total: 0
})
const addDialogVisible = ref(false)
const newTableForm = reactive({
  db_tbl: '',
  db: '',
  tbl: '',
  create_sql_name: '',
  create_sql: '',
  insert_sql_name: '',
  insert_sql: '',
  tbl_desc: '',
  owner: ''
})
const newTableFormRef = ref(null)
const sqlNames = ref([])
const editDialogVisible = ref(false)
const editTableForm = reactive({
  id: null,
  db_tbl: '',
  db: '',
  tbl: '',
  create_sql_name: '',
  create_sql: '',
  insert_sql_name: '',
  insert_sql: '',
  tbl_desc: '',
  owner: '',
  related_table: []
})
const editTableFormRef = ref(null)

// 数据库选项
const dbOptions = ['ods', 'dwd', 'dws', 'dim','ads']

// 获取 ipcRenderer 实例
const ipcRenderer = window.require ? window.require('electron').ipcRenderer : null;

const fetchTables = async () => {
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
    const response = await ipcRenderer.invoke('fetch-tables', paramsToSend)
    if (response.success) {
      tables.value = response.data
      pagination.total = response.total
    } else {
      ElMessage.error('获取表信息失败: ' + response.message)
    }
  } catch (error) {
    ElMessage.error('获取表信息时发生错误: ' + error.message)
  } finally {
    loading.value = false
  }
}

const fetchOwners = async () => {
  if (!ipcRenderer) {
    ElMessage.error('IPC Renderer not available.');
    return;
  }
  try {
    const response = await ipcRenderer.invoke('fetch-users')
    if (response.success) {
      owners.value = response.data.map(u => u.name)
    } else {
      ElMessage.error('获取负责人失败: ' + response.message)
    }
  } catch (error) {
    ElMessage.error('获取负责人时发生错误: ' + error.message)
  }
}

const handleSearch = () => {
  fetchTables()
}

const resetSearch = () => {
  searchForm.tbl = ''
  searchForm.tbl_desc = ''
  searchForm.owner = ''
  fetchTables()
}

const handleSizeChange = (val) => {
  pagination.pageSize = val
  pagination.currentPage = 1
  fetchTables()
}

const handleCurrentChange = (val) => {
  pagination.currentPage = val
  fetchTables()
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
  resetNewTableForm()
  addDialogVisible.value = true
}
const resetNewTableForm = () => {
  newTableForm.db_tbl = ''
  newTableForm.db = ''
  newTableForm.tbl = ''
  newTableForm.create_sql_name = ''
  newTableForm.create_sql = ''
  newTableForm.insert_sql_name = ''
  newTableForm.insert_sql = ''
  newTableForm.tbl_desc = ''
  newTableForm.owner = ''
}
// 搜索 team_sql 的 name 字段
const fetchSqlNames = async (query) => {
  if (!ipcRenderer) return
  try {
    const response = await ipcRenderer.invoke('fetch-sql-names', query)
    if (response.success) {
      sqlNames.value = response.data
    }
  } catch (e) {}
}
const onCreateSqlNameChange = async (val) => {
  if (!val || !ipcRenderer) return
  try {
    const response = await ipcRenderer.invoke('fetch-sql-content-by-name', val)
    if (response.success) {
      newTableForm.create_sql = response.content
    } else {
      newTableForm.create_sql = ''
    }
  } catch (e) {
    newTableForm.create_sql = ''
  }
}
const onInsertSqlNameChange = async (val) => {
  if (!val || !ipcRenderer) return
  try {
    const response = await ipcRenderer.invoke('fetch-sql-content-by-name', val)
    if (response.success) {
      newTableForm.insert_sql = response.content
    } else {
      newTableForm.insert_sql = ''
    }
  } catch (e) {
    newTableForm.insert_sql = ''
  }
}
const handleAddTable = async () => {
  if (!ipcRenderer) return
  try {
    const paramsToSend = toRaw(newTableForm)
    paramsToSend.db_tbl = `${paramsToSend.db}.${paramsToSend.tbl}` // 自动计算数据库.表名
    const response = await ipcRenderer.invoke('create-table', paramsToSend)
    if (response.success) {
      ElMessage.success('新增表成功！')
      addDialogVisible.value = false
      fetchTables()
    } else {
      ElMessage.error('新增表失败: ' + response.message)
    }
  } catch (e) {
    ElMessage.error('新增表时发生错误: ' + e.message)
  }
}
const handleDialogClose = (done) => { done() }

const showEditDialog = (row) => {
  Object.assign(editTableForm, row)
  editDialogVisible.value = true
}
const onEditCreateSqlNameChange = async (val) => {
  if (!val || !ipcRenderer) return
  try {
    const response = await ipcRenderer.invoke('fetch-sql-content-by-name', val)
    if (response.success) {
      editTableForm.create_sql = response.content
      console.log('Updated create_sql:', editTableForm.create_sql)
    } else {
      editTableForm.create_sql = ''
    }
  } catch (e) {
    editTableForm.create_sql = ''
  }
}
const onEditInsertSqlNameChange = async (val) => {
  if (!val || !ipcRenderer) return
  try {
    const response = await ipcRenderer.invoke('fetch-sql-content-by-name', val)
    if (response.success) {
      editTableForm.insert_sql = response.content
      console.log('Updated insert_sql:', editTableForm.insert_sql)
    } else {
      editTableForm.insert_sql = ''
    }
  } catch (e) {
    editTableForm.insert_sql = ''
  }
}
const handleEditTable = async () => {
  if (!ipcRenderer) return
  try {
    const paramsToSend = toRaw(editTableForm)
    paramsToSend.db_tbl = `${paramsToSend.db}.${paramsToSend.tbl}` // 自动计算数据库.表名
    console.log('Submitting update with create_sql:', paramsToSend.create_sql)
    console.log('Submitting update with insert_sql:', paramsToSend.insert_sql)
    const response = await ipcRenderer.invoke('update-table', paramsToSend)
    if (response.success) {
      ElMessage.success('编辑表成功！')
      editDialogVisible.value = false
      fetchTables()
    } else {
      ElMessage.error('编辑表失败: ' + response.message)
    }
  } catch (e) {
    ElMessage.error('编辑表时发生错误: ' + e.message)
  }
}
const handleEditDialogClose = (done) => { done() }

const handleDeleteTable = (id) => {
  if (!ipcRenderer) return
  ElMessageBox.confirm('确定要删除此表吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(async () => {
      try {
        const response = await ipcRenderer.invoke('delete-table', id)
        if (response.success) {
          ElMessage.success('表删除成功！')
          fetchTables()
        } else {
          ElMessage.error('表删除失败: ' + response.message)
        }
      } catch (e) {
        ElMessage.error('表删除时发生错误: ' + e.message)
      }
    })
    .catch(() => {
      ElMessage.info('已取消删除')
    })
}

const fetchRelatedTables = async () => {
  if (!ipcRenderer) {
    ElMessage.error('IPC Renderer not available.');
    return;
  }
  try {
    const response = await ipcRenderer.invoke('fetch-table-related-tables')
    if (response.success) {
      relatedTables.value = response.data
    } else {
      ElMessage.error('获取关联表失败: ' + response.message)
    }
  } catch (error) {
    ElMessage.error('获取关联表时发生错误: ' + error.message)
  }
}
onMounted(() => {
  fetchOwners()
  fetchRelatedTables()
  fetchTables()
})
const relatedTables = ref([])

const copyToClipboard = (text) => {
  if (!text) return
  navigator.clipboard.writeText(text).then(() => {
    ElMessage.success('复制成功')
  }).catch(() => {
    ElMessage.error('复制失败')
  })
}
</script>

<style scoped>
.table-management {
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
.copyable {
  cursor: pointer;
}
.copyable:hover {
  color: #409EFF;
}
</style>


