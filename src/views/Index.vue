<template>
  <div class="index-view">
    <el-row :gutter="20" class="stat-cards">
      <el-col :span="6" v-for="(item, idx) in stats" :key="item.label">
        <el-card :class="'stat-card clickable'" @click="goTab(idx)">
          <div class="stat-label">{{ item.label }}</div>
          <div class="stat-value">
            <span>{{ item.displayValue }}</span>
          </div>
        </el-card>
      </el-col>
    </el-row>
    <el-row :gutter="30" class="chart-row">
      <el-col :span="6">
        <div ref="pieChartRef" class="pie-container"></div>
      </el-col>
      <el-col :span="18">
        <div ref="scatterChartRef" class="scatter-container"></div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import * as echarts from 'echarts'

const router = useRouter()

const stats = ref([
  { label: '人员总数', value: 0, displayValue: 0 },
  { label: '表总量', value: 0, displayValue: 0 },
  { label: '脚本总量', value: 0, displayValue: 0 },
  { label: '接口总量', value: 0, displayValue: 0 }
])

const tabMap = ['users', 'tables', 'scripts', 'apis']

function goTab(idx) {
  router.push({ name: tabMap[idx] })
}

const scatterChartRef = ref(null)
const pieChartRef = ref(null)
let pieChartInstance = null
let scatterChartInstance = null

const ipcRenderer = window.require ? window.require('electron').ipcRenderer : null

function animateValue(item, start, end, duration = 300) {
  const startTime = performance.now()
  function update(now) {
    const elapsed = now - startTime
    if (elapsed < duration) {
      item.displayValue = Math.floor(start + (end - start) * (elapsed / duration))
      requestAnimationFrame(update)
    } else {
      item.displayValue = end
    }
  }
  requestAnimationFrame(update)
}

const fetchStats = async () => {
  if (!ipcRenderer) return
  try {
    const result = await ipcRenderer.invoke('query-global-stats')
    if (Array.isArray(result)) {
      result.forEach(([label, value], idx) => {
        const item = stats.value[idx]
        if (item) {
          animateValue(item, item.displayValue, Number(value), 300)
          item.value = Number(value)
        }
      })
    }
  } catch (e) {
    // 可根据需要处理错误
  }
}

const drawPie = (data) => {
  if (!pieChartRef.value) return
  if (!pieChartInstance) {
    pieChartInstance = echarts.init(pieChartRef.value)
  }
  const option = {
    tooltip: { trigger: 'item' },
    legend: { orient: 'vertical', left: 'left' },
    series: [
      {
        name: '库分类',
        type: 'pie',
        radius: '70%',
        center: ['55%', '50%'],
        data: data.map(d => ({ name: d.db, value: d.value })),
        label: { formatter: '{b} ({c})' },
        emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0,0,0,0.2)' } }
      }
    ]
  }
  pieChartInstance.setOption(option)
  pieChartInstance.resize()
}

const fetchPieData = async () => {
  if (!ipcRenderer) return
  try {
    const data = await ipcRenderer.invoke('fetch-table-db-pie-data')
    if (Array.isArray(data)) {
      drawPie(data)
    }
  } catch (e) {}
}

const drawScatter = (data) => {
  if (!scatterChartRef.value) return
  if (!scatterChartInstance) {
    scatterChartInstance = echarts.init(scatterChartRef.value)
  }
  
  // 规范化db名称并去重
  const normalizeDb = (db) => (db || '').toString().toLowerCase().trim()
  const dbMap = new Map()
  data.forEach(d => {
    const normalizedDb = normalizeDb(d.db)
    if (!dbMap.has(normalizedDb)) {
      dbMap.set(normalizedDb, d.db) // 保存原始名称
    }
  })
  
  // 使用规范化后的唯一db列表
  const dbs = Array.from(dbMap.values())
  
  // 为不同db指定固定颜色
  const dbColors = {
    'dwd': '#F4D03F',  // 黄色
    'ods': '#3498DB',  // 蓝色
    'ads': '#2ECC71'   // 绿色
  }

  // 创建分类
  const categories = dbs.map(db => {
    const color = dbColors[normalizeDb(db)] || '#95A5A6'
    return {
      name: db,
      itemStyle: { color }
    }
  })

  // 创建节点
  const nodes = data.map(d => {
    const normalizedDb = normalizeDb(d.db)
    const categoryIndex = dbs.indexOf(dbMap.get(normalizedDb))
    const color = dbColors[normalizedDb] || '#95A5A6'
    return {
      name: d.tbl,
      category: categoryIndex,
      symbolSize: 30,
      itemStyle: {
        color: color,
        opacity: 0.8
      },
      label: { 
        show: true, 
        fontSize: 12,
        color: '#333',
        position: 'right'
      }
    }
  })

  const option = {
    tooltip: { 
      trigger: 'item',
      formatter: p => `表名: ${p.data.name}<br/>库: ${dbs[p.data.category]}`
    },
    legend: [{ 
      data: dbs,
      orient: 'vertical',
      right: 10,
      top: 20,
      itemWidth: 15,
      itemHeight: 15,
      textStyle: { fontSize: 12 }
    }],
    series: [{
      type: 'graph',
      layout: 'force',
      data: nodes,
      categories: categories,
      roam: true,
      force: { 
        repulsion: 100,
        edgeLength: 50,
        gravity: 0.1
      },
      draggable: true,
      links: [],
      emphasis: {
        focus: 'adjacency'
      }
    }]
  }
  
  scatterChartInstance.setOption(option)
  scatterChartInstance.resize()
}

const fetchScatterData = async () => {
  if (!ipcRenderer) return
  try {
    const data = await ipcRenderer.invoke('fetch-table-scatter-data')
    if (Array.isArray(data)) {
      drawScatter(data)
    }
  } catch (e) {}
}

onMounted(() => {
  fetchStats()
  fetchPieData()
  fetchScatterData()
})
</script>

<style scoped>
.index-view {
  padding: 30px;
}
.stat-cards {
  margin-bottom: 30px;
}
.stat-label {
  font-size: 18px;
  color: #666;
  margin-bottom: 8px;
}
.stat-value {
  font-size: 32px;
  font-weight: bold;
  color: #409EFF;
}
.chart-row {
  margin-top: 30px;
  margin-bottom: 30px;
  align-items: flex-start;
  display: flex;
}
.pie-container {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px #eee;
  padding: 20px 0 10px 0;
  min-height: 340px;
  max-width: 480px;
  display: flex;
  justify-content: center;
  align-items: center;
}
.scatter-container {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px #eee;
  padding: 20px 0 10px 0;
  min-height: 700px;
  height: 700px;
  display: flex;
  justify-content: center;
  align-items: center;
}
.stat-card.clickable {
  cursor: pointer;
  transition: box-shadow 0.2s;
}
.stat-card.clickable:hover {
  box-shadow: 0 0 12px #409eff44;
}
</style> 