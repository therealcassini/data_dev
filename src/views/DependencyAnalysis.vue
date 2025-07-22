<template>
  <div class="dependency-analysis">
    <el-tabs v-model="activeTab" type="card">
      <el-tab-pane label="表依赖关系分析">
        <div class="analysis-content">
          <el-card class="box-card">
        <template #header>
          <div class="card-header">
            <span>表依赖关系分析</span>
          </div>
        </template>
        <div class="input-container">
          <el-input
            v-model="tableName"
            placeholder="请输入表名"
            style="width: 300px; margin-right: 10px;"
          />
          <el-button type="primary" @click="analyzeDependencies">分析依赖</el-button>
          <el-button type="primary" @click="analyzeDependent">分析被依赖</el-button>
        </div>
        <div class="dependency-graph">
          <!-- 这里将添加依赖关系图表 -->
          <div v-if="dependencies.length === 0 && dependents.length === 0">
            <p>请输入表名并点击分析按钮</p>
          </div>
          <div v-else>
            <div id="dependencyChart" class="chart-container"></div>
          </div>
        </div>
      </el-card>
    </div>
  </el-tab-pane>
  <el-tab-pane label="全部依赖查看">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>全部依赖数据</span>
        </div>
      </template>
      <div class="all-dependencies-container">
        <div v-if="allDependencies.loading">
          <p>加载中...</p>
        </div>
        <div v-else-if="allDependencies.error">
          <p>加载失败: {{ allDependencies.error }}</p>
        </div>
        <div v-else-if="allDependencies.data.length === 0">
          <p>没有找到依赖数据</p>
        </div>
        <div v-else>
          <div class="all-dependencies-graph">
            <div id="allDependenciesChart" class="all-dependencies-chart-container"></div>
          </div>
        </div>
      </div>
    </el-card>
  </el-tab-pane>
</el-tabs>
</div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
// 仅在Electron环境中导入ipcRenderer
let ipcRenderer
if (window.require) {
  ipcRenderer = window.require('electron').ipcRenderer
}
// 引入echarts
import * as echarts from 'echarts'

const tableName = ref('')
const dependencies = ref({ nodes: [], links: [] })
const dependents = ref({ nodes: [], links: [] })
const activeTab = ref('0')
const allDependencies = ref({ loading: false, error: '', data: [] })
let chart = null
let chartDom = null

onMounted(() => {
  // 初始化图表容器
  nextTick(() => {
    chartDom = document.getElementById('dependencyChart')
    if (chartDom) {
      chart = echarts.init(chartDom)
      console.log('图表容器初始化成功')
    } else {
      console.error('图表容器初始化失败')
    }
  })

  // 监听标签切换
  watch(activeTab, (newValue) => {
    if (newValue === '1') {
      fetchAllDependencies()
    }
  })
})

onUnmounted(() => {
  // 销毁图表
  if (chart) {
    chart.dispose()
    chart = null
  }
})

// 分析依赖
function analyzeDependencies() {
  if (!tableName.value.trim()) {
    alert('请输入表名')
    return
  }

  // 清空之前的结果
  dependencies.value = { nodes: [], links: [] }
  dependents.value = { nodes: [], links: [] }

  // 检查ipcRenderer是否存在
  if (!ipcRenderer) {
    console.error('ipcRenderer is not initialized')
    alert('无法连接到主进程，请确保在Electron环境中运行')
    return
  }

  // 调用主进程的方法获取依赖关系
  console.log('调用analyze-dependencies方法，表名:', tableName.value)
  ipcRenderer.invoke('analyze-dependencies', tableName.value).then(result => {
    console.log('analyze-dependencies结果:', result)
    if (result.success) {
      dependencies.value = result.data
      console.log('依赖数据:', dependencies.value)
      // 渲染图表
      renderChart()
    } else {
      alert('分析失败: ' + result.message)
    }
  }).catch(error => {
    console.error('分析依赖失败:', error)
    alert('分析依赖失败')
  })
}

// 分析被依赖
function analyzeDependent() {
  if (!tableName.value.trim()) {
    alert('请输入表名')
    return
  }

  // 清空之前的结果
  dependencies.value = { nodes: [], links: [] }
  dependents.value = { nodes: [], links: [] }

  // 检查ipcRenderer是否存在
  if (!ipcRenderer) {
    console.error('ipcRenderer is not initialized')
    alert('无法连接到主进程，请确保在Electron环境中运行')
    return
  }

  // 调用主进程的方法获取被依赖关系
  console.log('调用analyze-dependent方法，表名:', tableName.value)
  ipcRenderer.invoke('analyze-dependent', tableName.value).then(result => {
    console.log('analyze-dependent结果:', result)
    if (result.success) {
      dependents.value = result.data
      console.log('被依赖数据:', dependents.value)
      // 渲染图表
      renderChart()
    } else {
      alert('分析失败: ' + result.message)
    }
  }).catch(error => {
    console.error('分析被依赖失败:', error)
    alert('分析被依赖失败')
  })
}

// 获取全部依赖数据
function fetchAllDependencies() {
  // 检查ipcRenderer是否存在
  if (!ipcRenderer) {
    console.error('ipcRenderer is not initialized')
    allDependencies.value = {
      loading: false,
      error: '无法连接到主进程，请确保在Electron环境中运行',
      data: []
    }
    return
  }

  // 设置加载状态
  allDependencies.value = {
    loading: true,
    error: '',
    data: []
  }

  // 调用主进程的方法获取全部依赖数据
  console.log('调用get-all-dependencies方法')
  ipcRenderer.invoke('get-all-dependencies').then(result => {
    console.log('get-all-dependencies结果:', result)
    if (result.success) {
      allDependencies.value = {
        loading: false,
        error: '',
        data: result.data
      }
      // 渲染全部依赖图表
      renderAllDependenciesChart()
    } else {
      allDependencies.value = {
        loading: false,
        error: '获取失败: ' + result.message,
        data: []
      }
    }
  }).catch(error => {
    console.error('获取全部依赖数据失败:', error)
    allDependencies.value = {
      loading: false,
      error: '获取失败: ' + error.message,
      data: []
    }
  })
}

// 复制文本到剪贴板
function copyToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    // 现代浏览器安全上下文
    navigator.clipboard.writeText(text).then(() => {
      console.log('节点名称已复制到剪贴板:', text);
      // 显示复制成功的提示
      alert('节点名称 "' + text + '" 已复制到剪贴板');
    }).catch(err => {
      console.error('复制失败:', err);
    });
  } else {
    // 回退方案
    const textArea = document.createElement('textarea');
    textArea.value = text;
    // 确保文本区域不在可视范围内
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      console.log('节点名称已复制到剪贴板:', text);
      alert('节点名称 "' + text + '" 已复制到剪贴板');
    } catch (err) {
      console.error('复制失败:', err);
    }
    document.body.removeChild(textArea);
  }
}

// 渲染全部依赖图表
function renderAllDependenciesChart() {
  console.log('开始渲染全部依赖图表');
  console.log('全部依赖数据:', allDependencies.value.data);

  // 确保图表容器可见
  nextTick(() => {
    // 立即尝试获取图表容器
    const chartDom = document.getElementById('allDependenciesChart');
    console.log('全部依赖图表容器是否存在:', !!chartDom);

    if (chartDom) {
      // 确保容器有正确的尺寸
      console.log('图表容器尺寸:', '宽度=' + chartDom.offsetWidth + 'px, 高度=' + chartDom.offsetHeight + 'px');

      // 创建图表实例
      try {
        const chart = echarts.init(chartDom);
        console.log('全部依赖图表实例已创建');

        // 准备数据
        const nodes = []
        const links = []
        const nodeSet = new Set()

        // 处理节点和链接
        allDependencies.value.data.forEach(item => {
          if (!nodeSet.has(item.table_name)) {
            nodes.push({
              id: item.table_name,
              name: item.table_name,
              symbolSize: 30,
              // 为节点添加自定义样式
              itemStyle: {
                color: '#673AB7',
                borderColor: '#FFFFFF',
                borderWidth: 2,
                shadowBlur: 10,
                shadowColor: 'rgba(0, 0, 0, 0.3)'
              },
              // 悬停效果
              emphasis: {
                itemStyle: {
                  color: '#9C27B0',
                  borderColor: '#FFFFFF',
                  borderWidth: 3,
                  shadowBlur: 15,
                  shadowColor: 'rgba(0, 0, 0, 0.5)'
                },
                label: {
                  fontSize: 16,
                  fontWeight: 'bold'
                }
              }
            })
            nodeSet.add(item.table_name)
          }
          if (!nodeSet.has(item.dependent_table)) {
            nodes.push({
              id: item.dependent_table,
              name: item.dependent_table,
              symbolSize: 30,
              // 为节点添加自定义样式
              itemStyle: {
                color: '#673AB7',
                borderColor: '#FFFFFF',
                borderWidth: 2,
                shadowBlur: 10,
                shadowColor: 'rgba(0, 0, 0, 0.3)'
              },
              // 悬停效果
              emphasis: {
                itemStyle: {
                  color: '#9C27B0',
                  borderColor: '#FFFFFF',
                  borderWidth: 3,
                  shadowBlur: 15,
                  shadowColor: 'rgba(0, 0, 0, 0.5)'
                },
                label: {
                  fontSize: 16,
                  fontWeight: 'bold'
                }
              }
            })
            nodeSet.add(item.dependent_table)
          }
          links.push({
            source: item.table_name,
            target: item.dependent_table,
            lineStyle: {
              color: '#9E9E9E',
              width: 2,
              curveness: 0.3
            }
          })
        })

        console.log('全部依赖节点数量:', nodes.length);
        console.log('全部依赖链接数量:', links.length);

        // 配置图表
        const option = {
          tooltip: {
            formatter: '{b}'
          },
          animationDurationUpdate: 1500,
          animationEasingUpdate: 'quinticInOut',
          series: [
            {
              type: 'graph',
              layout: 'force',
              force: {
                repulsion: 1000,
                edgeLength: 100,
                gravity: 0.2
              },
              roam: true,
              draggable: true,
              label: {
                show: true,
                fontSize: 12,
                fontWeight: 'normal',
                position: 'right',
                distance: 10
              },
              data: nodes,
              links: links,
              symbol: ['circle'],
              symbolSize: 30,
              edgeSymbol: ['none', 'arrow'],
              edgeSymbolSize: 10,
              lineStyle: {
                color: 'source',
                curveness: 0.3
              },
              // 点击事件
              itemStyle: {
                color: '#673AB7',
                borderColor: '#FFFFFF',
                borderWidth: 2,
                shadowBlur: 10,
                shadowColor: 'rgba(0, 0, 0, 0.3)'
              },
              emphasis: {
                itemStyle: {
                  color: '#9C27B0',
                  borderColor: '#FFFFFF',
                  borderWidth: 3,
                  shadowBlur: 15,
                  shadowColor: 'rgba(0, 0, 0, 0.5)'
                },
                label: {
                  fontSize: 16,
                  fontWeight: 'bold'
                }
              },
              // 注册点击事件
              onClick: function(params) {
                // 复制节点名称到剪贴板
                copyToClipboard(params.data.name);
              }
            }
          ]
        };

        // 设置图表选项
        chart.setOption(option);
        console.log('全部依赖图表选项设置完成');

        // 强制刷新图表
        chart.resize();

        // 监听窗口大小变化，重新调整图表大小
        window.addEventListener('resize', () => {
          chart.resize();
        });

        // 在组件卸载时销毁图表
        onUnmounted(() => {
          if (chart) {
            chart.dispose();
          }
        });
      } catch (error) {
        console.error('渲染全部依赖图表失败:', error);
      }
    } else {
      console.error('找不到全部依赖图表容器');
    }
  });
}

// 渲染图表
function renderChart() {
  console.log('开始渲染图表');
  console.log('依赖数据:', dependencies.value);
  console.log('被依赖数据:', dependents.value);

  // 确保图表容器可见
  nextTick(() => {
    // 立即尝试获取图表容器
    chartDom = document.getElementById('dependencyChart');
    console.log('图表容器是否存在:', !!chartDom);

    if (chartDom) {
      // 销毁旧的图表实例（如果存在）
      if (chart) {
        chart.dispose();
        chart = null;
        console.log('旧图表实例已销毁');
      }

      // 创建新的图表实例
      chart = echarts.init(chartDom);
      console.log('新图表实例已创建');

      // 准备数据
      const nodes = []
      const links = []
      const nodeSet = new Set()

      // 合并依赖和被依赖的数据
      const allNodes = [...dependencies.value.nodes, ...dependents.value.nodes]
      const allLinks = [...dependencies.value.links, ...dependents.value.links]

      // 处理节点
      allNodes.forEach(node => {
        if (!nodeSet.has(node)) {
          // 设置节点大小，当前表更大
          const size = node === tableName.value ? 40 : 30
          nodes.push({ id: node, name: node, symbolSize: size })
          nodeSet.add(node)
          console.log('添加节点:', node);
        }
      })

      // 处理链接
      allLinks.forEach(link => {
        links.push({
          source: link.source,
          target: link.target
        })
        console.log('添加链接:', link.source, '->', link.target);
      })

      console.log('节点数量:', nodes.length);
      console.log('链接数量:', links.length);

      // 配置图表
      const option = {
        tooltip: {
          formatter: '{b}'
        },
        animationDurationUpdate: 1500,
        animationEasingUpdate: 'quinticInOut',
        series: [
          {
            type: 'graph',
            layout: 'force',
            force: {
              repulsion: 1500,
              edgeLength: 120,
              gravity: 0.1
            },
            roam: true,
            draggable: true,
            label: {
              show: true,
              fontSize: 12,
              fontWeight: 'normal',
              position: 'right',
              distance: 10
            },
            data: nodes,
            links: links,
            symbol: ['circle'],
            symbolSize: function (val) {
              // 确保val不是undefined并且有id属性
              if (val && val.id) {
                // 当前表更大
                return val.id === tableName.value ? 40 : 30;
              }
              // 如果val是undefined或者没有id属性，返回默认大小
              return 30;
            },
            edgeSymbol: ['none', 'arrow'],
            edgeSymbolSize: 10,
            lineStyle: {
              color: 'source',
              curveness: 0.3
            },
            itemStyle: {
              color: function (val) {
                // 当前表有不同的颜色
                return val.id === tableName.value ? '#E91E63' : '#673AB7';
              },
              borderColor: '#FFFFFF',
              borderWidth: 2,
              shadowBlur: 10,
              shadowColor: 'rgba(0, 0, 0, 0.3)'
            },
            emphasis: {
              itemStyle: {
                color: function (val) {
                  return val.id === tableName.value ? '#F44336' : '#9C27B0';
                },
                borderColor: '#FFFFFF',
                borderWidth: 3,
                shadowBlur: 15,
                shadowColor: 'rgba(0, 0, 0, 0.5)'
              },
              label: {
                fontSize: 16,
                fontWeight: 'bold'
              }
            },
            // 注册点击事件
            onClick: function(params) {
              // 复制节点名称到剪贴板
              copyToClipboard(params.data.name);
            }
          }
        ]
      };

      // 设置图表选项
      chart.setOption(option);
      console.log('图表选项设置完成');

      // 强制刷新图表
      chart.resize();
    } else {
      console.error('找不到图表容器');
    }
  });
}
</script>

<style scoped>
.dependency-analysis {
  padding: 20px;
  width: 100%;
  box-sizing: border-box;
}

.analysis-content {
  margin-top: 20px;
  width: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.input-container {
  margin: 20px 0;
  display: flex;
  align-items: center;
  width: 100%;
}

.dependency-graph {
  min-height: 1200px;
  width: 100%;
  padding: 20px;
  box-sizing: border-box;
  overflow: auto;
}

.all-dependencies-graph {
  margin-top: 20px;
  overflow: auto;
  width: 100%;
  box-sizing: border-box;
}

.chart-container {
  width: 100%;
  height: 1200px;
}

/* 统一两个tab下的图表样式 */
.all-dependencies-chart-container {
  width: 100%;
  height: 1200px;
  margin: 0 auto;
}

.all-dependencies-chart-container {
  width: 90vh;
  height: 90vh;
  margin: 0 auto;
}
</style>