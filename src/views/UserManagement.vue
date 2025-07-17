<template>
  <div class="user-management">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>用户管理</span>
          <el-button type="primary" :icon="Plus" @click="dialogVisible = true">添加用户</el-button>
        </div>
      </template>

      <el-table :data="users" v-loading="loading" style="width: 100%" border>
        <el-table-column prop="id" label="ID" width="80"></el-table-column>
        <el-table-column prop="name" label="姓名"></el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="scope">
            <el-popconfirm
              title="确定删除此用户吗?"
              confirm-button-text="是"
              cancel-button-text="否"
              @confirm="deleteUser(scope.row.id)"
            >
              <template #reference>
                <el-button type="danger" :icon="Delete">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      title="添加新用户"
      width="30%"
      :before-close="handleClose"
    >
      <el-form :model="form" label-width="80px">
        <el-form-item label="姓名">
          <el-input v-model="form.name" placeholder="请输入用户姓名"></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="addUser">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Delete } from '@element-plus/icons-vue'

const users = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const form = ref({
  name: ''
})

// 获取 ipcRenderer 实例
const ipcRenderer = window.require ? window.require('electron').ipcRenderer : null;

const fetchUsers = async () => {
  if (!ipcRenderer) {
    ElMessage.error('IPC Renderer not available.');
    return;
  }
  loading.value = true
  try {
    const response = await ipcRenderer.invoke('fetch-users')
    if (response.success) {
      users.value = response.data
    } else {
      ElMessage.error('获取用户失败: ' + response.message)
    }
  } catch (error) {
    ElMessage.error('获取用户时发生错误: ' + error.message)
  } finally {
    loading.value = false
  }
}

const addUser = async () => {
  if (!ipcRenderer) {
    ElMessage.error('IPC Renderer not available.');
    return;
  }
  if (!form.value.name.trim()) {
    ElMessage.warning('请输入用户姓名')
    return
  }

  try {
    const response = await ipcRenderer.invoke('add-user', form.value.name)
    if (response.success) {
      ElMessage.success('用户添加成功！')
      dialogVisible.value = false
      form.value.name = '' // 清空表单
      fetchUsers() // 重新加载用户列表
    } else {
      ElMessage.error('用户添加失败: ' + response.message)
    }
  } catch (error) {
    ElMessage.error('添加用户时发生错误: ' + error.message)
  }
}

const deleteUser = async (id) => {
  if (!ipcRenderer) {
    ElMessage.error('IPC Renderer not available.');
    return;
  }
  try {
    const response = await ipcRenderer.invoke('delete-user', id)
    if (response.success) {
      ElMessage.success('用户删除成功！')
      fetchUsers() // 重新加载用户列表
    } else {
      ElMessage.error('用户删除失败: ' + response.message)
    }
  } catch (error) {
    ElMessage.error('删除用户时发生错误: ' + error.message)
  }
}

const handleClose = (done) => {
  ElMessageBox.confirm('确定关闭对话框吗？')
    .then(() => {
      done()
    })
    .catch(() => {
      // do nothing
    })
}

onMounted(() => {
  fetchUsers()
})
</script>

<style scoped>
.user-management {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.el-table {
  margin-top: 20px;
}

.dialog-footer button:first-child {
  margin-right: 10px;
}
</style> 