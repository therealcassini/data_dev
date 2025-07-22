<template>
  <div class="home">
    <el-container>
      <!-- <el-header>
        <div class="header-content">
          <h2>数据开发平台</h2>
        </div>
      </el-header> -->
      
      <el-main>
        <el-tabs
          v-model="activeTab"
          type="card"
          @tab-click="handleTabClick"
        >
          <el-tab-pane label="首页" name="index">
            <router-view v-if="activeTab === 'index'" />
          </el-tab-pane>
          <el-tab-pane label="脚本管理" name="scripts">
            <router-view v-if="activeTab === 'scripts'" />
          </el-tab-pane>
          <el-tab-pane label="表管理" name="tables">
            <router-view v-if="activeTab === 'tables'" />
          </el-tab-pane>
          <el-tab-pane label="接口管理" name="apis">
            <router-view v-if="activeTab === 'apis'" />
          </el-tab-pane>
          <el-tab-pane label="SQL分析" name="sql-analysis">
            <router-view v-if="activeTab === 'sql-analysis'" />
          </el-tab-pane>
          <el-tab-pane label="测试Editor" name="test-editor">
            <router-view v-if="activeTab === 'test-editor'" />
          </el-tab-pane>
          <el-tab-pane label="依赖分析" name="dependency-analysis">
            <router-view v-if="activeTab === 'dependency-analysis'" />
          </el-tab-pane>
          <el-tab-pane label="表元数据" name="table-metadata">
            <router-view v-if="activeTab === 'table-metadata'" />
          </el-tab-pane>
          <el-tab-pane label="用户管理" name="users">
            <router-view v-if="activeTab === 'users'" />
          </el-tab-pane>
        </el-tabs>
      </el-main>
    </el-container>
  </div>
</template>

<script>
export default {
  name: 'Home',
  data() {
    return {
      activeTab: 'scripts'
    }
  },
  methods: {
    handleTabClick(tab) {
      this.$router.push({ name: tab.props.name })
    }
  },
  created() {
    // 根据当前路由设置活动标签
    const path = this.$route.path.split('/').pop()
    if (path && ['index', 'users', 'scripts', 'tables', 'apis', 'sql-analysis', 'table-metadata', 'test-editor', 'dependency-analysis'].includes(path)) {
      this.activeTab = path
    } else {
      this.activeTab = 'index'
    }
  },
  watch: {
    '$route'(to) {
      const path = to.path.split('/').pop()
      if (['index', 'users', 'scripts', 'tables', 'apis', 'sql-analysis', 'table-metadata', 'test-editor', 'dependency-analysis'].includes(path)) {
        this.activeTab = path
      }
    }
  }
}
</script>

<style scoped>
.home {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.el-container {
  height: 100%;
}

.el-header {
  background-color: #409EFF;
  color: white;
  padding: 0 20px;
}

.header-content {
  height: 60px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.user-profile {
  display: flex;
  align-items: center;
  cursor: pointer;
  color: white;
}

.username {
  margin-left: 8px;
}

.el-main {
  padding: 20px;
  background-color: #f5f7fa;
}

:deep(.el-tabs__header) {
  margin-bottom: 20px;
}

:deep(.el-tabs__item) {
  height: 40px;
  line-height: 40px;
}

:deep(.el-tabs__item.is-active) {
  background-color: #409EFF;
  color: white;
  border-color: #409EFF;
}
</style>