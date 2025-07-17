# DataDevPlatform

这是一个使用 Vue 3 和 Electron 构建的数据开发平台桌面应用程序。该应用提供了数据库管理、SQL分析、API管理等功能，帮助开发人员更高效地进行数据开发工作。

## 项目特点

- 基于 Vue 3 和 Electron 构建的跨平台桌面应用
- 提供直观的数据库管理界面
- 支持 SQL 语法高亮和分析
- 集成 API 管理功能
- 现代化的用户界面，基于 Element Plus 组件库
- 支持数据可视化

## 项目设置

### 安装依赖
```bash
npm install
```

### 开发模式运行
```bash
npm run electron:dev
```

### 构建生产版本
```bash
npm run electron:build
```

## 项目结构

```
├── electron/          # Electron 主进程代码
├── src/              # Vue 应用源代码
│   ├── assets/       # 静态资源
│   ├── components/   # Vue 组件
│   ├── router/       # 路由配置
│   ├── views/        # 页面视图
│   ├── App.vue       # 根组件
│   └── main.js       # 应用入口
├── index.html        # HTML 模板
├── vite.config.js    # Vite 配置
└── package.json      # 项目配置
```

## 技术栈

- Vue 3
- Electron
- Vite
- Vue Router
- Pinia (状态管理)
- Element Plus (UI组件库)
- CodeMirror (代码编辑器)
- ECharts (数据可视化)

## 功能模块

1. **数据库管理**
   - 表格管理
   - 元数据查看
   - SQL查询分析

2. **API管理**
   - API创建和编辑
   - API测试
   - API文档生成

3. **脚本管理**
   - 脚本创建和编辑
   - 脚本执行和调试

4. **用户管理**
   - 用户权限控制
   - 角色管理

## 贡献指南

1. 克隆项目
```bash
git clone https://github.com/yourusername/datadevplatform.git
```
2. 创建分支
```bash
git checkout -b feature/your-feature
```
3. 提交更改
```bash
git commit -m "Add your feature"
```
4. 推送分支
```bash
git push origin feature/your-feature
```
5. 创建Pull Request

## 许可证

MIT 许可证

版权所有 © 2023 DataDevPlatform

 Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.