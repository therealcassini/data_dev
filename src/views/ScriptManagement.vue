<template>
  <div class="script-management">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>脚本管理</span>
          <el-button type="primary" :icon="Plus" @click="showAddDialog">新增脚本</el-button>
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
              <el-select v-model="searchForm.owner" placeholder="请选择负责人" clearable filterable style="width: 100%;">
                <el-option v-for="item in owners" :key="item" :label="item" :value="item"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="脚本类型">
              <el-select v-model="searchForm.script_type" placeholder="请选择脚本类型" clearable style="width: 100%;">
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
        <el-table-column prop="name" label="脚本名称">
          <template #default="scope">
            <el-link type="primary" @click="showSqlPreviewDialog(scope.row)">{{ scope.row.name }}</el-link>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="脚本描述" show-overflow-tooltip></el-table-column>
        <el-table-column prop="script_type" label="脚本类型" width="100"></el-table-column>
        <el-table-column prop="related_tables" label="关联的表" show-overflow-tooltip></el-table-column>
        <el-table-column prop="owner" label="负责人" width="100"></el-table-column>
        <el-table-column prop="create_time" label="创建时间" width="160" :formatter="dateTimeFormatter"></el-table-column>
        <el-table-column prop="update_time" label="更新时间" width="160" :formatter="dateTimeFormatter"></el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
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
              @click="handleDeleteScript(scope.row.id)"
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
        >
        </el-pagination>
      </div>
    </el-card>

    <!-- 新增脚本弹窗 -->
    <el-dialog
      v-model="addDialogVisible"
      title="新增脚本"
      width="80%" height="80%"
      :before-close="handleDialogClose"
      @opened="onAddDialogOpened"
    >
      <el-form :model="newScriptForm" :rules="addScriptRules" label-width="100px" ref="newScriptFormRef">
        <el-form-item label="脚本名称" prop="name">
          <el-input v-model="newScriptForm.name" placeholder="请输入脚本名称" :spellcheck="false"></el-input>
        </el-form-item>
        <el-form-item label="脚本描述" prop="description">
          <el-input v-model="newScriptForm.description" type="textarea" placeholder="请输入脚本描述" :spellcheck="false"></el-input>
        </el-form-item>
        <el-form-item label="脚本类型" prop="script_type">
          <el-select v-model="newScriptForm.script_type" placeholder="请选择脚本类型" style="width: 100%;">
            <el-option v-for="item in scriptTypes" :key="item" :label="item" :value="item"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="关联的表" prop="related_tables">
          <el-input v-model="newScriptForm.related_tables" placeholder="请输入关联的表名，多个用逗号分隔" :spellcheck="false"></el-input>
        </el-form-item>
        <el-form-item label="负责人" prop="owner">
          <el-select v-model="newScriptForm.owner" placeholder="请选择负责人" filterable style="width: 100%;">
            <el-option v-for="item in owners" :key="item" :label="item" :value="item"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="SQL内容" prop="content" >
          <SqlCodeMirror v-if="addDialogVisible" v-model="newScriptForm.content" ref="sqlEditorRef" :options="{ lineNumbers: false }" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="addDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleAddScript">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 编辑脚本弹窗 -->
    <el-dialog
      v-model="editDialogVisible"
      title="编辑脚本"
      width="80%"
      :before-close="handleEditDialogClose"
    >
      <el-form :model="editScriptForm" label-width="100px" ref="editScriptFormRef">
        <el-form-item label="ID" prop="id">
          <el-input v-model="editScriptForm.id" disabled></el-input>
        </el-form-item>
        <el-form-item label="脚本名称" prop="name" required>
          <el-input v-model="editScriptForm.name" placeholder="请输入脚本名称"></el-input>
        </el-form-item>
        <el-form-item label="脚本描述" prop="description">
          <el-input v-model="editScriptForm.description" type="textarea" placeholder="请输入脚本描述"></el-input>
        </el-form-item>
        <el-form-item label="脚本类型" prop="script_type" required>
          <el-select v-model="editScriptForm.script_type" placeholder="请选择脚本类型" style="width: 100%;">
            <el-option v-for="item in scriptTypes" :key="item" :label="item" :value="item"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="关联的表" prop="related_tables">
          <el-input v-model="editScriptForm.related_tables" placeholder="请输入关联的表名，多个用逗号分隔"></el-input>
        </el-form-item>
        <el-form-item label="负责人" prop="owner">
          <el-select v-model="editScriptForm.owner" placeholder="请选择负责人" filterable style="width: 100%;">
            <el-option v-for="item in owners" :key="item" :label="item" :value="item"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="SQL内容" prop="content" >
          <SqlCodeMirror v-model="editScriptForm.content" style="text-align: left;" :options="{ lineNumbers: false }" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="editDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleEditScript">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 在 <template> 末尾新增 SQL内容预览弹窗 -->
    <el-dialog
      v-model="sqlPreviewDialogVisible"
      :title="sqlPreviewTitle"
      width="60%"
      destroy-on-close
      close-on-click-modal
      :show-close="false"
    >
      <SqlCodeMirror
        v-if="sqlPreviewDialogVisible"
        v-model="sqlPreviewContent"
        ref="sqlPreviewEditorRef"
        :options="{ readOnly: true, lineNumbers: false }"
      />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, toRaw, watch, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Plus, Delete, Edit } from '@element-plus/icons-vue'
import { useRoute } from 'vue-router'
import 'codemirror/lib/codemirror.css'
import 'codemirror/mode/sql/sql.js'
import SqlCodeMirror from '../components/SqlCodeMirror.vue'

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
  pageSize: 20,
  total: 0
})

const scriptTypes = ref([])
const owners = ref([])

const addDialogVisible = ref(false)
const newScriptForm = reactive({
  name: '',
  description: '',
  script_type: '',
  content: '',
  related_tables: '',
  owner: ''
})
const newScriptFormRef = ref(null)
const sqlEditorRef = ref(null)

const editDialogVisible = ref(false)
const editScriptForm = reactive({
  id: null,
  name: '',
  description: '',
  script_type: '',
  content: '',
  related_tables: '',
  owner: ''
})
const editScriptFormRef = ref(null)
const originalEditScriptForm = ref('');

const route = useRoute();

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

const showAddDialog = () => {
  resetNewScriptForm();
  addDialogVisible.value = true;
  nextTick(() => {
    if (newScriptFormRef.value) {
      newScriptFormRef.value.clearValidate();
    }
  });
}

const resetNewScriptForm = () => {
  newScriptForm.name = '';
  newScriptForm.description = '';
  newScriptForm.script_type = '';
  newScriptForm.content = '';
  newScriptForm.related_tables = '';
  newScriptForm.owner = '';
  // if (newScriptFormRef.value) {
  //   newScriptFormRef.value.resetFields(); // This might not work perfectly with reactive objects
  // }
};

const addScriptRules = {
  name: [
    { required: true, message: '请输入脚本名称', trigger: 'blur' }
  ],
  script_type: [
    { required: true, message: '请选择脚本类型', trigger: ['blur', 'change'] }
  ],
  content: [
    { required: true, message: '请输入SQL内容', trigger: 'blur' }
  ]
};

const handleAddScript = () => {
  if (!newScriptFormRef.value) return;
  newScriptFormRef.value.validate(async (valid) => {
    if (!valid) return;
    if (!ipcRenderer) {
      ElMessage.error('IPC Renderer not available.');
      return;
    }
    try {
      const paramsToSend = toRaw(newScriptForm);
      console.log('Adding script with params:', paramsToSend);
      const response = await ipcRenderer.invoke('add-script', paramsToSend);
      if (response.success) {
        ElMessage.success('脚本添加成功！');
        addDialogVisible.value = false;
        fetchScripts(); // Refresh list
      } else {
        ElMessage.error('脚本添加失败: ' + response.message);
      }
    } catch (error) {
      ElMessage.error('添加脚本时发生错误: ' + error.message);
    }
  });
};

const handleDeleteScript = async (id) => {
  if (!ipcRenderer) {
    ElMessage.error('IPC Renderer not available.');
    return;
  }

  ElMessageBox.confirm(
    '确定要删除此脚本吗？',
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  )
    .then(async () => {
      try {
        const response = await ipcRenderer.invoke('delete-script', id);
        if (response.success) {
          ElMessage.success('脚本删除成功！');
          fetchScripts(); // Refresh list
        } else {
          ElMessage.error('脚本删除失败: ' + response.message);
        }
      } catch (error) {
        ElMessage.error('删除脚本时发生错误: ' + error.message);
      }
    })
    .catch(() => {
      ElMessage.info('已取消删除');
    });
};

const showEditDialog = async (script) => {
  Object.assign(editScriptForm, toRaw(script));
  if (script.id && ipcRenderer) {
    try {
      const response = await ipcRenderer.invoke('fetch-script-detail', script.id);
      if (response.success && response.data) {
        editScriptForm.content = response.data.content;
      }
    } catch (e) {
      console.error('获取脚本详情失败', e);
    }
  }
  originalEditScriptForm.value = JSON.stringify(toRaw(editScriptForm));
  console.log('编辑脚本内容 script:', script);
  console.log('赋值后 editScriptForm.content:', editScriptForm.content);
  editDialogVisible.value = true;
};

const handleEditScript = async () => {
  if (!ipcRenderer) {
    ElMessage.error('IPC Renderer not available.');
    return;
  }

  // Basic validation
  if (!editScriptForm.name.trim() || !editScriptForm.script_type.trim() || !editScriptForm.content.trim()) {
    ElMessage.warning('脚本名称、脚本类型和SQL内容为必填项！');
    return;
  }

  try {
    const paramsToSend = toRaw(editScriptForm);
    console.log('Updating script with params:', paramsToSend);
    const response = await ipcRenderer.invoke('update-script', paramsToSend);

    if (response.success) {
      ElMessage.success('脚本更新成功！');
      editDialogVisible.value = false;
      fetchScripts(); // Refresh list
    } else {
      ElMessage.error('脚本更新失败: ' + response.message);
    }
  } catch (error) {
    ElMessage.error('更新脚本时发生错误: ' + error.message);
  }
};

const handleDialogClose = (done) => {
  ElMessageBox.confirm('确定关闭对话框吗？未保存的更改将丢失。')
    .then(() => {
      done();
    })
    .catch(() => {
      // do nothing
    });
};

const handleEditDialogClose = (done) => {
  const current = JSON.stringify(toRaw(editScriptForm));
  if (current !== originalEditScriptForm.value) {
    ElMessageBox.confirm('确定关闭对话框吗？未保存的更改将丢失。')
      .then(() => {
        done();
      })
      .catch(() => {
        // do nothing
      });
  } else {
    done();
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

const cmOptions = {
  mode: 'text/x-sql',
  lineNumbers: true,
  theme: 'default',
}

const onAddDialogOpened = () => {
  if (sqlEditorRef.value && sqlEditorRef.value.refresh) {
    sqlEditorRef.value.refresh();
  }
};

const sqlPreviewDialogVisible = ref(false)
const sqlPreviewContent = ref('')
const sqlPreviewTitle = ref('SQL内容预览')
const sqlPreviewEditorRef = ref(null)

async function showSqlPreviewDialog(row) {
  let content = row.content;
  // 如果 content 为空，尝试通过 id 拉取详情
  if ((!content || content === '') && row.id && ipcRenderer) {
    try {
      const response = await ipcRenderer.invoke('fetch-script-detail', row.id);
      if (response.success && response.data) {
        content = response.data.content;
      }
    } catch (e) {
      console.error('获取脚本详情失败', e);
    }
  }
  sqlPreviewContent.value = content || '';
  sqlPreviewTitle.value = `【${row.name}】SQL内容`;
  sqlPreviewDialogVisible.value = true;
  nextTick(() => {
    if (sqlPreviewEditorRef.value && sqlPreviewEditorRef.value.refresh) {
      sqlPreviewEditorRef.value.refresh();
    }
  });
}

// 在组件挂载时获取脚本数据和下拉选项
onMounted(() => {
  fetchDropdownOptions();
  fetchScripts();
});

// 监听路由变化，每次进入本页面都刷新
watch(
  () => route.fullPath,
  (newPath, oldPath) => {
    fetchDropdownOptions();
    fetchScripts();
  }
);
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

:deep(.el-dialog__body) {
  padding: 24px 32px 16px 32px !important;
}
</style> 