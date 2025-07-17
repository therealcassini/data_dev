<template>
  <div class="table-metadata-view">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>表元数据查询</span>
        </div>
      </template>
      <el-tabs v-model="activeTab" style="margin-bottom: 20px;">
        <el-tab-pane label="表格数据" name="table">
          <el-form :model="searchForm" class="search-form" label-position="right" label-width="80px">
            <el-row :gutter="20">
              <el-col :span="8">
                <el-form-item label="数据日期">
                  <el-date-picker
                    v-model="searchForm.data_date"
                    type="date"
                    value-format="YYYY-MM-DD"
                    placeholder="选择日期"
                    style="width: 50%;"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="表名">
                  <el-input v-model="searchForm.tbl" placeholder="请输入表名" clearable style="width: 80%;" />
                </el-form-item>
              </el-col>
              <el-col :span="4" style="text-align: right;">
                <el-form-item>
                  <el-button type="primary" @click="fetchData">查询</el-button>
                  <el-button @click="resetSearch">重置</el-button>
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
          <el-table :data="tableData" border style="width: 100%; margin-top: 20px;">
            <el-table-column prop="id" label="ID" align="left" show-overflow-tooltip />
            <el-table-column prop="db" label="数据库名" align="left" show-overflow-tooltip />
            <el-table-column prop="tbl" label="表名" align="left" show-overflow-tooltip />
            <el-table-column prop="db_tbl" label="完整库表名" align="left" show-overflow-tooltip />
            <el-table-column prop="volume" label="数据量(行数)" align="left" show-overflow-tooltip />
            <el-table-column prop="data_date" label="数据日期" align="left" show-overflow-tooltip />
            <el-table-column prop="insert_time" label="记录插入时间" align="left" :formatter="formatTime" show-overflow-tooltip />
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="数据量统计" name="chart">
          <div class="chart-wrapper">
            <div ref="barChartRef" style="width: 100%; height: 480px;"></div>
          </div>
          <div class="chart-wrapper">
            <div ref="bubbleChartRef" style="width: 100%; height: 400px;"></div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue';
import { ElMessage } from 'element-plus';
import * as echarts from 'echarts';

const ipcRenderer = window.require ? window.require('electron').ipcRenderer : null;

const today = new Date();
const pad = n => n < 10 ? '0' + n : n;
const defaultDate = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

const searchForm = ref({
  data_date: defaultDate,
  tbl: ''
});

const tableData = ref([]);
const activeTab = ref('table');
const barChartRef = ref(null);
const bubbleChartRef = ref(null);
let chartInstance = null;
let bubbleChartInstance = null;

const fetchData = async () => {
  if (!ipcRenderer) return;
  try {
    const params = { ...searchForm.value };
    const result = await ipcRenderer.invoke('fetch-table-metadata', params);
    if (Array.isArray(result)) {
      tableData.value = result;
      if (activeTab.value === 'chart') {
        await nextTick();
        renderBarChart();
        renderBubbleChart();
      }
    } else {
      ElMessage.error('查询失败');
    }
  } catch (e) {
    ElMessage.error('查询失败: ' + e.message);
  }
};

const resetSearch = () => {
  searchForm.value.tbl = '';
  searchForm.value.data_date = defaultDate;
  fetchData();
};

function formatTime(row, column, cellValue) {
  if (!cellValue) return '';
  const d = new Date(cellValue);
  const y = d.getFullYear();
  const m = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const h = pad(d.getHours());
  const min = pad(d.getMinutes());
  const s = pad(d.getSeconds());
  return `${y}-${m}-${day} ${h}:${min}:${s}`;
}

function renderBarChart() {
  if (!barChartRef.value) return;
  if (!chartInstance) {
    chartInstance = echarts.init(barChartRef.value);
  }
  const xData = tableData.value.map(item => item.tbl);
  const yData = tableData.value.map(item => item.volume);
  const option = {
    tooltip: { trigger: 'axis' },
    grid: { left: 60, right: 40, bottom: 60, top: 40 },
    xAxis: {
      type: 'category',
      data: xData,
      axisLabel: { interval: 0, rotate: 30, fontSize: 12 }
    },
    yAxis: {
      type: 'value',
      name: '数据量(行数)'
    },
    series: [
      {
        type: 'bar',
        data: yData,
        itemStyle: { color: '#409EFF' },
        barMaxWidth: 40
      }
    ]
  };
  chartInstance.setOption(option);
  chartInstance.resize();
}

function renderBubbleChart() {
  if (!bubbleChartRef.value) return;
  if (!bubbleChartInstance) {
    bubbleChartInstance = echarts.init(bubbleChartRef.value);
  }
  const xData = tableData.value.map(item => item.tbl);
  const yData = tableData.value.map(item => item.volume);
  // 计算气泡大小，归一化到[20, 60]区间
  const min = Math.min(...yData);
  const max = Math.max(...yData);
  const sizeScale = v => {
    if (max === min) return 40;
    return 20 + 40 * (v - min) / (max - min);
  };
  const data = xData.map((tbl, i) => [i, yData[i], sizeScale(yData[i]), tbl]);
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: p => `${p.data[3]}<br/>数据量: ${p.data[1]}`
    },
    grid: { left: 60, right: 40, bottom: 60, top: 40 },
    xAxis: {
      type: 'category',
      data: xData,
      axisLabel: { interval: 0, rotate: 30, fontSize: 12 },
      name: '表名'
    },
    yAxis: {
      type: 'value',
      name: '数据量(行数)'
    },
    series: [
      {
        type: 'scatter',
        symbolSize: d => d[2],
        data,
        itemStyle: { color: '#E6A23C', opacity: 0.7 }
      }
    ]
  };
  bubbleChartInstance.setOption(option);
  bubbleChartInstance.resize();
}

watch(activeTab, async (val) => {
  if (val === 'chart') {
    await nextTick();
    renderBarChart();
    renderBubbleChart();
  }
});

watch(tableData, () => {
  if (activeTab.value === 'chart') {
    nextTick(() => {
      renderBarChart();
      renderBubbleChart();
    });
  }
});

onMounted(fetchData);
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: flex-start;
  align-items: center;
}
.search-form {
  margin-bottom: 20px;
  padding: 15px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  background-color: #ffffff;
}
.chart-wrapper {
  width: 100%;
  min-height: 480px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px #eee;
  padding: 20px 10px 10px 10px;
  margin-bottom: 20px;
}
</style> 