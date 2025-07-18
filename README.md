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


##数据表结构
```
-- data_dev_hk.monthly_data definition

CREATE TABLE `monthly_data` (
  `year` int DEFAULT NULL,
  `month` int DEFAULT NULL,
  `count` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- data_dev_hk.team_api definition

CREATE TABLE `team_api` (
  `id` int NOT NULL AUTO_INCREMENT,
  `module` varchar(50) NOT NULL COMMENT '功能模块',
  `top_module` varchar(100) NOT NULL COMMENT '一级模块',
  `sub_module` varchar(100) DEFAULT NULL COMMENT '子模块',
  `suggestion` text COMMENT '处理意见',
  `remark` text COMMENT '备注',
  `developer` varchar(50) NOT NULL COMMENT '研发负责人',
  `progress` varchar(50) NOT NULL DEFAULT '未开始',
  `related_table` varchar(1000) DEFAULT NULL COMMENT '关联的表(db.tbl格式)',
  `create_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `url` varchar(255) DEFAULT NULL,
  `content` text,
  `script` text,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='API模块';


-- data_dev_hk.team_sql definition

CREATE TABLE `team_sql` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL COMMENT '脚本名称',
  `description` varchar(500) DEFAULT NULL COMMENT '脚本描述',
  `script_type` varchar(20) NOT NULL COMMENT 'DDL|DML|DQL|ETL',
  `content` longtext NOT NULL COMMENT 'SQL内容',
  `related_tables` varchar(1000) DEFAULT NULL COMMENT '关联的表',
  `owner` varchar(100) DEFAULT NULL COMMENT '负责人',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP,
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=1160 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='SQL脚本';


-- data_dev_hk.team_table definition

CREATE TABLE `team_table` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `db_tbl` varchar(100) NOT NULL COMMENT '数据库.表名',
  `db` varchar(100) NOT NULL COMMENT '数据库名',
  `tbl` varchar(100) NOT NULL COMMENT '表名',
  `create_sql_name` varchar(256) DEFAULT NULL COMMENT '关联team_sql_name',
  `create_sql` longtext COMMENT '建表SQL语句',
  `insert_sql` longtext COMMENT '插入数据SQL模板',
  `tbl_desc` varchar(4096) DEFAULT NULL COMMENT '表描述',
  `insert_sql_name` varchar(256) DEFAULT NULL COMMENT '关联team_sql_name',
  `owner` varchar(100) DEFAULT NULL COMMENT '负责人',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP,
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_db_tbl` (`db_tbl`)
) ENGINE=InnoDB AUTO_INCREMENT=777 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='数据表信息';


-- data_dev_hk.team_table_dependencies definition

CREATE TABLE `team_table_dependencies` (
  `id` int NOT NULL AUTO_INCREMENT,
  `item` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '表名',
  `depend_on` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '被依赖的表',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- data_dev_hk.team_table_metadata definition

CREATE TABLE `team_table_metadata` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '自增主键ID',
  `db` varchar(64) NOT NULL COMMENT '数据库名',
  `tbl` varchar(64) NOT NULL COMMENT '表名',
  `db_tbl` varchar(128) NOT NULL COMMENT '完整库表名(库名.表名)',
  `volume` bigint DEFAULT NULL COMMENT '数据量(行数)',
  `data_date` varchar(18) DEFAULT NULL COMMENT '数据日期(业务日期)',
  `insert_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '记录插入时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=120 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='表元数据信息';


-- data_dev_hk.team_user definition

CREATE TABLE `team_user` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '用户ID',
  `name` varchar(50) NOT NULL COMMENT '姓名',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='团队成员';


-- data_dev_hk.time_dimension definition

CREATE TABLE `time_dimension` (
  `dim_year` char(4) NOT NULL COMMENT '年份',
  `dim_month` char(2) NOT NULL COMMENT '月份',
  `dim_date` date NOT NULL COMMENT '日期',
  `dim_day` char(2) NOT NULL COMMENT '日',
  `ymd` char(8) NOT NULL COMMENT 'yyyymmdd数字格式',
  `iso_date` char(10) NOT NULL COMMENT 'yyyy-mm-dd',
  `qtr` char(2) NOT NULL COMMENT '季度Q1-Q4',
  `week_num` char(3) NOT NULL COMMENT '周数W01-W53',
  `weekday` char(3) DEFAULT NULL COMMENT '星期Mon-Sun',
  PRIMARY KEY (`ymd`),
  KEY `idx_ymd` (`ymd`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='时间维度表(字段无冲突)';
```




MIT 许可证

版权所有 © 2023 DataDevPlatform

 Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.