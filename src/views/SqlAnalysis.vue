<template>
  <div class="sql-analysis-view">
    <el-card>
      <template #header>
        <span>SQL血缘分析</span>
      </template>
      <div class="codemirror-container">
        <Codemirror
          v-model:value="sqlInput"
          :options="cmOptions"
          border
          ref="cmRef"
          style="width: 100%; height: 60vh; min-height: 300px;"
        />
      </div>
      <div class="analyze-button-container">
        <el-button type="primary" :icon="Search" @click="analyzeSql" :loading="isLoading">
          分析SQL
        </el-button>
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
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import Codemirror from 'codemirror-editor-vue3';
import 'codemirror/lib/codemirror.css';
import 'codemirror/mode/sql/sql.js';
import { Parser } from 'node-sql-parser';
import { Search } from '@element-plus/icons-vue';

const sqlInput = ref('');
const analysisResult = ref('');
const errorMessage = ref('');
const isLoading = ref(false);
const parser = new Parser();
const cmRef = ref();
const cmOptions = {
  mode: 'text/x-sql',
  lineNumbers: true,
  theme: 'default',
  lineWrapping: true,
};

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
.el-card {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
}
.codemirror-container {
  margin-bottom: 5px;
  width: 100%;
  text-align: left;
  position: relative;
}
.analyze-button-container {
  width: 100%;
  display: flex;
  justify-content: flex-end;
  margin-bottom: 15px;
  margin-left: -5px;
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