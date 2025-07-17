import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import App from './App.vue'
import { InstallCodeMirror } from "codemirror-editor-vue3"; 
// import AceEditor from "vue3-ace-editor";
import router from './router'

const app = createApp(App)

// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// app.component("AceEditor", AceEditor);
app.use(createPinia())
app.use(router)
app.use(ElementPlus)
app.use(InstallCodeMirror); 
app.mount('#app') 