<template>
  <div class="script-management">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>脚本管理</span>
        </div>
      </template>

      <el-form :model="searchForm" class="search-form" label-position="right" label-width="80px">
        <!-- 第一行：脚本名称、脚本描述、负责人、脚本类型 -->
        <el-row :gutter="20">
          <el-col :span="6">
            <el-form-item label="脚本名称">
              <el-input v-model="searchForm.name" placeholder="请输入脚本名称" clearable></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="脚本描述">
              <el-input v-model="searchForm.description" placeholder="请输入脚本描述" clearable></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="负责人">
              <el-select v-model="searchForm.owner" placeholder="请选择负责人" clearable filterable style="width: 120px;">
                <el-option v-for="item in owners" :key="item" :label="item" :value="item"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="脚本类型">
              <el-select v-model="searchForm.script_type" placeholder="请选择脚本类型" clearable style="width: 180px;">
                <el-option v-for="item in scriptTypes" :key="item" :label="item" :value="item"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 第二行：SQL内容 -->
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="SQL内容">
              <el-input v-model="searchForm.content" placeholder="请输入SQL内容关键词" clearable style="width: 100%;"></el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 第三行：查询和重置按钮 -->
        <el-row>
          <el-col :span="24" style="text-align: right;">
            <el-form-item>
              <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
              <el-button :icon="Refresh" @click="resetSearch">重置</el-button>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <el-table :data="scripts" v-loading="loading" style="width: 100%" border>
        <el-table-column prop="id" label="ID" width="80"></el-table-column>
        <el-table-column prop="name" label="脚本名称"></el-table-column>
        <el-table-column prop="description" label="脚本描述" show-overflow-tooltip></el-table-column>
        <el-table-column prop="script_type" label="脚本类型" width="100"></el-table-column>
        <el-table-column prop="related_tables" label="关联的表" show-overflow-tooltip></el-table-column>
        <el-table-column prop="owner" label="负责人" width="100"></el-table-column>
        <el-table-column prop="create_time" label="创建时间" width="160" :formatter="dateTimeFormatter"></el-table-column>
        <el-table-column prop="update_time" label="更新时间" width="160" :formatter="dateTimeFormatter"></el-table-column>
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
        >
        </el-pagination>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, toRaw } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Refresh } from '@element-plus/icons-vue'

const scripts = ref([])
const loading = ref(false)
const searchForm = reactive({
  name: '',
  description: '',
  owner: '',
  script_type: '',
  content: ''
})
const pagination = reactive({
  currentPage: 1,
  pageSize: 20, // 将默认每页显示条数修改为20
  total: 0
})

const scriptTypes = ref([])
const owners = ref([])

// 获取 ipcRenderer 实例
const ipcRenderer = window.require ? window.require('electron').ipcRenderer : null;

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

const fetchScripts = async () => {
  if (!ipcRenderer) {
    ElMessage.error('IPC Renderer not available.');
    return;
  }
  loading.value = true
  try {
    // 将 reactive 对象转换为普通对象以避免 IPC 序列化问题
    const paramsToSend = {
      page: pagination.currentPage,
      pageSize: pagination.pageSize,
      searchParams: toRaw(searchForm) // 使用 toRaw 转换
    };
    console.log('Sending IPC message with params:', paramsToSend);

    const response = await ipcRenderer.invoke('fetch-scripts', paramsToSend)
    if (response.success) {
      scripts.value = response.data
      pagination.total = response.total
    } else {
      ElMessage.error('获取脚本失败: ' + response.message)
    }
  } catch (error) {
    ElMessage.error('获取脚本时发生错误: ' + error.message)
  } finally {
    loading.value = false
  }
}

const fetchDropdownOptions = async () => {
  if (!ipcRenderer) {
    ElMessage.error('IPC Renderer not available.');
    return;
  }
  try {
    // Fetch script types
    const scriptTypeResponse = await ipcRenderer.invoke('fetch-script-types');
    if (scriptTypeResponse.success) {
      scriptTypes.value = scriptTypeResponse.data;
    } else {
      ElMessage.error('获取脚本类型失败: ' + scriptTypeResponse.message);
    }

    // Fetch owners
    const ownersResponse = await ipcRenderer.invoke('fetch-owners');
    if (ownersResponse.success) {
      owners.value = ownersResponse.data;
    } else {
      ElMessage.error('获取负责人列表失败: ' + ownersResponse.message);
    }

  } catch (error) {
    ElMessage.error('获取下拉选项时发生错误: ' + error.message);
  }
};

const handleSearch = () => {
  pagination.currentPage = 1 // 搜索时重置回第一页
  fetchScripts()
}

const resetSearch = () => {
  Object.keys(searchForm).forEach(key => {
    searchForm[key] = ''
  })
  pagination.currentPage = 1
  fetchScripts()
}

const handleSizeChange = (val) => {
  pagination.pageSize = val
  fetchScripts()
}

const handleCurrentChange = (val) => {
  pagination.currentPage = val
  fetchScripts()
}

// 在组件挂载时获取脚本数据和下拉选项
onMounted(() => {
  fetchDropdownOptions();
  fetchScripts()
})
</script>

<style scoped>
.script-management {
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