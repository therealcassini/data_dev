<template>
  <div class="sql-analysis-view">
    <div class="card">
      <div class="card-header">
        <span>SQL血缘分析</span>
      </div>
      <div class="codemirror-container">
        <el-form-item label="脚本名称" prop="sql_name" style="margin-bottom: 15px;">
          <el-select v-model="sqlName" filterable remote reserve-keyword placeholder="请选择脚本名称" :remote-method="fetchSqlNames" style="width: 100%;" @change="onSqlNameChange">
            <el-option v-for="item in sqlNames" :key="item" :label="item" :value="item"></el-option>
          </el-select>
        </el-form-item>
        <el-input
          v-model="sqlInput"
          type="textarea"
          :rows="30"
          placeholder="请输入SQL语句"
          style="min-height: 600px; background-color: #e6f7ff; resize: vertical; margin: 0 auto; display: block;"
        />
         <div class="analyze-button-container">
        <el-button type="primary" :icon="Search" @click="analyzeSql" :loading="isLoading">
          分析SQL
        </el-button>
      </div>
      </div>
     
      <div v-if="analysisResultObj" class="result-display">
        <h3>分析结果</h3>
        <div class="result-row"><span class="result-label">来源表：</span>{{ analysisResultObj.sources.join(', ') }}</div>
        <div class="result-row"><span class="result-label">去向表：</span>{{ analysisResultObj.destinations.join(', ') }}</div>
      </div>
      <div v-if="errorMessage" class="error-display">
        <h3>错误信息</h3>
        <pre>{{ errorMessage }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { Parser } from 'node-sql-parser';
import { Search } from '@element-plus/icons-vue';

// 获取 ipcRenderer 实例
const ipcRenderer = window.require ? window.require('electron').ipcRenderer : null;

const sqlInput = ref('');
const sqlName = ref('');
const sqlNames = ref([]);
const analysisResult = ref('');
const errorMessage = ref('');
const isLoading = ref(false);
const parser = new Parser();

// 初始化时获取脚本名称列表
onMounted(() => {
  fetchSqlNames('');
});

// 获取脚本名称列表
function fetchSqlNames(query) {
  if (!ipcRenderer) return
  try {
    ipcRenderer.invoke('fetch-sql-names', query)
      .then(result => {
        if (result.success) {
          sqlNames.value = result.data
        }
      })
  } catch (e) {}
}

// 当选择脚本名称时触发
function onSqlNameChange(value) {
  if (!value || !ipcRenderer) return
  try {
    ipcRenderer.invoke('fetch-sql-content-by-name', value)
      .then(result => {
        if (result.success) {
          sqlInput.value = result.content
        } else {
          sqlInput.value = ''
        }
      })
  } catch (e) {
    sqlInput.value = ''
  }
}

const analysisResultObj = computed(() => {
  if (!analysisResult.value) return null;
  try {
    const obj = JSON.parse(analysisResult.value);
    return {
      sources: obj['来源表'] || [],
      destinations: obj['去向表'] || []
    };
  } catch {
    return null;
  }
});

function collectSourceTables(node, sources) {
  if (!node) return;
  if (Array.isArray(node.from)) {
    node.from.forEach(f => {
      if (f.table) {
        if (typeof f.table === 'string') {
          sources.add(f.table);
        } else {
          collectSourceTables(f.table, sources);
        }
      }
      if (f.expr) {
        collectSourceTables(f.expr, sources);
      }
      if (f.on) {
        collectSourceTables(f.on, sources);
      }
    });
  }
  if (Array.isArray(node.join)) {
    node.join.forEach(j => {
      if (j.table) {
        if (typeof j.table === 'string') {
          sources.add(j.table);
        } else {
          collectSourceTables(j.table, sources);
        }
      }
      if (j.on) {
        collectSourceTables(j.on, sources);
      }
    });
  }
  if (node.type === 'select' && node.from) {
    node.from.forEach(f => {
      if (f.as && f.expr && f.expr.type === 'select') {
        collectSourceTables(f.expr, sources);
      }
    });
  }
  if (node.union) {
    if (Array.isArray(node.union)) {
      node.union.forEach(u => collectSourceTables(u, sources));
    } else {
      collectSourceTables(node.union, sources);
    }
  }
  if (node.with && node.with.as) {
    collectSourceTables(node.with.as, sources);
  }
  Object.keys(node).forEach(key => {
    const val = node[key];
    if (Array.isArray(val)) {
      val.forEach(v => {
        if (v && typeof v === 'object') collectSourceTables(v, sources);
      });
    } else if (val && typeof val === 'object' && key !== 'parent') {
      collectSourceTables(val, sources);
    }
  });
}

function analyzeSql() {
  isLoading.value = true;
  analysisResult.value = '';
  errorMessage.value = '';

  if (!sqlInput.value.trim()) {
    errorMessage.value = '请输入SQL语句后再分析。';
    isLoading.value = false;
    return;
  }

  setTimeout(() => {
    try {
      const ast = parser.astify(sqlInput.value, { database: 'MySQL' });
      const astArray = Array.isArray(ast) ? ast : [ast];
      const sources = new Set();
      const destinations = new Set();
      astArray.forEach(statement => {
        collectSourceTables(statement, sources);
        if (statement.type === 'insert' || statement.type === 'update') {
          if(statement.table) {
            destinations.add(statement.table[0].table);
          }
        } else if (statement.type === 'create' && statement.table) {
          destinations.add(statement.table[0].table);
        }
      });
      analysisResult.value = JSON.stringify({
        来源表: [...sources],
        去向表: [...destinations]
      });
    } catch (e) {
      errorMessage.value = `SQL解析失败:\n${e.message}`;
    } finally {
      isLoading.value = false;
    }
  }, 200);
}
</script>

<style scoped>
.sql-analysis-view {
  padding: 20px;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  min-height: 80vh;
}
.card {
  width: 100%;
  max-width: 100%;
  margin: 0 auto;
  background-color: #ffffff;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: 20px;
}
.card-header {
  padding-bottom: 15px;
  margin-bottom: 15px;
  border-bottom: 1px solid #e4e7ed;
  font-size: 16px;
  font-weight: bold;
  color: #303133;
}
.codemirror-container {
  margin-bottom: 15px;
  width: 100%;
  text-align: left;
  position: relative;
}
.analyze-button-container {
  width: 100%;
  display: flex;
  justify-content: flex-end;
  margin-bottom: 15px;
  margin-top: 8px;
}
.result-display, .error-display {
  background-color: #f5f7fa;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 30px 20px 30px 20px;
  margin: 0 auto;
  max-width: 1400px;
  min-height: 80px;
  text-align: left;
}
.result-display h3, .error-display h3 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #303133;
  text-align: left;
}
.result-row {
  margin: 12px 0;
  font-size: 16px;
  word-break: break-all;
}
.result-label {
  font-weight: bold;
  color: #409EFF;
}
pre {
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: 'Courier New', Courier, monospace;
  color: #303133;
}
.error-display pre {
    color: #f56c6c;
}
</style>