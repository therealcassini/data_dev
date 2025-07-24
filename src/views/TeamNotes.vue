<template>
  <div class="team-notes">
    <el-card>
      <template #header>
        <div class="card-header">
            <span>日志记录</span>
            <el-button v-if="currentMode === 'list'" type="primary" :icon="Plus" @click="switchToAdd">新增记录</el-button>
            <el-button v-if="currentMode === 'edit' || currentMode === 'add'" type="default" @click="switchToList">返回列表</el-button>
          </div>
      </template>

      <!-- 列表视图 -->
      <div v-if="currentMode === 'list'">
        <el-form :model="searchForm" class="search-form" label-position="right" label-width="80px">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="记录标题">
                <el-input v-model="searchForm.title" placeholder="请输入记录标题" clearable></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="创建时间">
                <el-date-picker
                  v-model="searchForm.created_at"
                  type="daterange"
                  range-separator="至"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
                  clearable
                ></el-date-picker>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row>
            <el-col :span="24" style="text-align: right;">
              <el-form-item>
                <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
                <el-button :icon="Refresh" @click="resetSearch">重置</el-button>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>

        <el-table :data="notes" v-loading="loading" style="width: 100%" border>
          <el-table-column prop="id" label="ID" width="80"></el-table-column>
          <el-table-column prop="title" label="记录标题"></el-table-column>
          <el-table-column prop="content" label="记录内容" show-overflow-tooltip></el-table-column>
          <el-table-column prop="created_at" label="创建时间" width="180" :formatter="dateTimeFormatter"></el-table-column>
          <el-table-column prop="updated_at" label="更新时间" width="180" :formatter="dateTimeFormatter"></el-table-column>
          <el-table-column label="操作" width="150" fixed="right">
            <template #default="scope">
              <el-button
                type="primary"
                :icon="Edit"
                size="small"
                @click="switchToEdit(scope.row)"
              ></el-button>
              <el-button
                type="danger"
                :icon="Delete"
                size="small"
                @click="handleDeleteNote(scope.row.id)"
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
      </div>

      <!-- 新增记录视图 -->
      <div v-if="currentMode === 'add'">
        <el-form :model="newNoteForm" :rules="addNoteRules" label-width="100px" ref="newNoteFormRef">
          <el-form-item label="记录标题" prop="title">
            <el-input v-model="newNoteForm.title" placeholder="请输入记录标题"></el-input>
          </el-form-item>
          <el-form-item label="记录内容" prop="content">
            <div v-if="isEditorReady && newNoteEditor">
              <Editor
                :modelValue="newNoteForm.content"
                :editor="newNoteEditor.value"
                @update:modelValue="val => newNoteForm.content = val"
                placeholder="请输入记录内容"
              />
            </div>
            <div v-else class="editor-loading">
              编辑器加载中...
            </div>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleAddNote">保存</el-button>
            <el-button @click="switchToList">取消</el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 编辑记录视图 -->
      <div v-if="currentMode === 'edit'">
        <el-form :model="editNoteForm" label-width="100px" ref="editNoteFormRef">
          <el-form-item label="ID" prop="id">
            <el-input v-model="editNoteForm.id" disabled></el-input>
          </el-form-item>
          <el-form-item label="记录标题" prop="title" required>
            <el-input v-model="editNoteForm.title" placeholder="请输入记录标题"></el-input>
          </el-form-item>
          <el-form-item label="记录内容" prop="content">
            <div v-if="isEditorReady && editNoteEditor">
              <Editor
                :modelValue="editNoteForm.content"
                :editor="editNoteEditor.value"
                @update:modelValue="val => editNoteForm.content = val"
                placeholder="请输入记录内容"
              />
            </div>
            <div v-else class="editor-loading">
              编辑器加载中...
            </div>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleEditNote">更新</el-button>
            <el-button @click="switchToList">取消</el-button>
          </el-form-item>
        </el-form>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount, toRaw, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Plus, Delete, Edit } from '@element-plus/icons-vue'
import { useRoute } from 'vue-router'
// 按照网页链接的方式导入
// 动态导入Editor和StarterKit
let Editor;
let StarterKit;
// 添加状态标志，跟踪编辑器是否准备好
const isEditorReady = ref(false);

// 在组件卸载时清理编辑器实例
onBeforeUnmount(() => {
  if (newNoteEditor.value) {
    newNoteEditor.value.destroy();
  }
  if (editNoteEditor.value) {
    editNoteEditor.value.destroy();
  }
})

// 在onMounted中加载依赖
onMounted(async () => {
  try {
    // 动态导入
    const tiptapVue = await import('@tiptap/vue-3');
    const tiptapStarterKit = await import('@tiptap/starter-kit');

    // 正确获取导出的Editor
    Editor = tiptapVue.Editor;
    StarterKit = tiptapStarterKit.default;

    console.log('Editor loaded successfully:', typeof Editor);
    // 设置编辑器准备好的标志
    isEditorReady.value = true;
  } catch (error) {
    console.error('Failed to load editor dependencies:', error);
    ElMessage.error('加载编辑器依赖失败');
  }
})

const notes = ref([])
const loading = ref(false)
const searchForm = reactive({
  title: '',
  created_at: []
})
const pagination = reactive({
  currentPage: 1,
  pageSize: 20,
  total: 0
})

// 切换模式: list, add, edit
const currentMode = ref('list')

const newNoteForm = reactive({
  title: '',
  content: ''
})
const newNoteFormRef = ref(null)

// 初始化新增记录的编辑器
const newNoteEditor = ref(null)
// 初始化编辑记录的编辑器
const editNoteEditor = ref(null)

// 监视模式变化，初始化或销毁编辑器
watch(
  () => currentMode.value,
  (newMode) => {
    if (!Editor || !StarterKit) {
      console.log('Editor dependencies not loaded yet');
      return;
    }

    // 清理旧实例
    if (newNoteEditor.value) {
      newNoteEditor.value.destroy();
      newNoteEditor.value = null;
    }
    if (editNoteEditor.value) {
      editNoteEditor.value.destroy();
      editNoteEditor.value = null;
    }

    // 创建新实例
    if (newMode === 'add') {
      newNoteEditor.value = new Editor({
        content: newNoteForm.content,
        extensions: [StarterKit],
        autofocus: true,
        onUpdate: ({ editor }) => {
          newNoteForm.content = editor.getHTML();
        }
      });
    } else if (newMode === 'edit') {
      editNoteEditor.value = new Editor({
        content: editNoteForm.content,
        extensions: [StarterKit],
        autofocus: true,
        onUpdate: ({ editor }) => {
          editNoteForm.content = editor.getHTML();
        }
      });
    }
  }
)

// 更新onMounted中的代码，设置isEditorLoaded
// 找到之前的onMounted代码并修改
// 我们会在下面的替换块中更新它

const editNoteForm = reactive({
  id: null,
  title: '',
  content: ''
})
const editNoteFormRef = ref(null)

watch(
  () => editNoteForm.content,
  (newContent) => {
    if (editNoteEditor.value && newContent !== editNoteEditor.value.getHTML()) {
      editNoteEditor.value.commands.setContent(newContent)
    }
  }
)

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

const fetchNotes = async () => {
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

    const response = await ipcRenderer.invoke('fetch-notes', paramsToSend)
    if (response.success) {
      notes.value = response.data
      pagination.total = response.total
    } else {
      ElMessage.error('获取记录失败: ' + response.message)
    }
  } catch (error) {
    ElMessage.error('获取记录时发生错误: ' + error.message)
  } finally {
    loading.value = false
  }
}

const resetNewNoteForm = () => {
  newNoteForm.title = '';
  newNoteForm.content = '';
};

const addNoteRules = {
  title: [
    { required: true, message: '请输入记录标题', trigger: 'blur' }
  ]
};

// 切换到新增模式
const switchToAdd = () => {
  resetNewNoteForm();
  currentMode.value = 'add';
  if (newNoteFormRef.value) {
    newNoteFormRef.value.clearValidate();
  }
}

// 切换到编辑模式
const switchToEdit = (note) => {
  Object.assign(editNoteForm, toRaw(note));
  currentMode.value = 'edit';
}

// 切换回列表模式
const switchToList = () => {
  currentMode.value = 'list';
}

const handleAddNote = () => {
  if (!newNoteFormRef.value) return;
  newNoteFormRef.value.validate(async (valid) => {
    if (!valid) return;
    if (!ipcRenderer) {
      ElMessage.error('IPC Renderer not available.');
      return;
    }
    try {
      const paramsToSend = toRaw(newNoteForm);
      const response = await ipcRenderer.invoke('add-note', paramsToSend);
      if (response.success) {
        ElMessage.success('记录添加成功！');
        switchToList();
        fetchNotes(); // Refresh list
      } else {
        ElMessage.error('记录添加失败: ' + response.message);
      }
    } catch (error) {
      ElMessage.error('添加记录时发生错误: ' + error.message);
    }
  });
};

const handleDeleteNote = async (id) => {
  if (!ipcRenderer) {
    ElMessage.error('IPC Renderer not available.');
    return;
  }

  ElMessageBox.confirm(
    '确定要删除此记录吗？',
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  )
    .then(async () => {
      try {
        const response = await ipcRenderer.invoke('delete-note', id);
        if (response.success) {
          ElMessage.success('记录删除成功！');
          fetchNotes(); // Refresh list
        } else {
          ElMessage.error('记录删除失败: ' + response.message);
        }
      } catch (error) {
        ElMessage.error('删除记录时发生错误: ' + error.message);
      }
    })
    .catch(() => {
      ElMessage.info('已取消删除');
    });
};

const handleEditNote = async () => {
  if (!ipcRenderer) {
    ElMessage.error('IPC Renderer not available.');
    return;
  }

  // Basic validation
  if (!editNoteForm.title.trim()) {
    ElMessage.warning('记录标题为必填项！');
    return;
  }

  try {
    const paramsToSend = toRaw(editNoteForm);
    const response = await ipcRenderer.invoke('update-note', paramsToSend);

    if (response.success) {
      ElMessage.success('记录更新成功！');
      switchToList();
      fetchNotes(); // Refresh list
    } else {
      ElMessage.error('记录更新失败: ' + response.message);
    }
  } catch (error) {
    ElMessage.error('更新记录时发生错误: ' + error.message);
  }
};

const handleSearch = () => {
  pagination.currentPage = 1 // 搜索时重置回第一页
  fetchNotes()
}

const resetSearch = () => {
  Object.keys(searchForm).forEach(key => {
    if (key === 'created_at') {
      searchForm[key] = [];
    } else {
      searchForm[key] = '';
    }
  })
  pagination.currentPage = 1
  fetchNotes()
}

const handleSizeChange = (val) => {
  pagination.pageSize = val
  fetchNotes()
}

const handleCurrentChange = (val) => {
  pagination.currentPage = val
  fetchNotes()
}

// 在组件挂载时获取记录数据
onMounted(() => {
  fetchNotes();
});

// 监听路由变化，每次进入本页面都刷新
watch(
  () => route.fullPath,
  (newPath, oldPath) => {
    // 确保回到列表模式
    currentMode.value = 'list';
    fetchNotes();
  }
);
</script>

<style scoped>
.team-notes {
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