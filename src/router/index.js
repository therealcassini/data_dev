import { createRouter, createWebHashHistory } from 'vue-router'
import Home from '../views/Home.vue'
import UserManagement from '../views/UserManagement.vue'
import ScriptManagement from '../views/ScriptManagement.vue'
import TableManagement from '../views/TableManagement.vue'
import ApiManagement from '../views/ApiManagement.vue'
import TestEditor from '../views/TestEditor.vue'
import Index from '../views/Index.vue'
import SqlAnalysis from '../views/SqlAnalysis.vue'
import TableMetadata from '../views/TableMetadata.vue'
import DependencyAnalysis from '../views/DependencyAnalysis.vue'

const routes = [
  {
    path: '/',
    redirect: '/index'
  },
  {
    path: '/',
    name: 'Home',
    component: Home,
    children: [
      {
        path: 'index',
        name: 'index',
        component: Index
      },
      {
        path: 'users',
        name: 'users',
        component: UserManagement
      },
      {
        path: 'scripts',
        name: 'scripts',
        component: ScriptManagement
      },
      {
        path: 'tables',
        name: 'tables',
        component: TableManagement
      },
      {
        path: 'apis',
        name: 'apis',
        component: ApiManagement
      },
      {
        path: 'sql-analysis',
        name: 'sql-analysis',
        component: SqlAnalysis
      },
      {
        path: 'test-editor',
        name: 'test-editor',
        component: TestEditor
      },
      {
        path: 'dependency-analysis',
        name: 'dependency-analysis',
        component: DependencyAnalysis
      },
      {
        path: 'table-metadata',
        name: 'table-metadata',
        component: TableMetadata
      }
    ]
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router