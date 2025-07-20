const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const isDev = process.env.NODE_ENV === 'development'
const mysql = require('mysql2/promise')

const dbConfig = {
    host: '103.56.114.40',
    port: 3333,
    database: 'data_dev_hk',
    user: 'root',
    password: 'happy_cassini2025'
};

async function createDbConnection() {
  try {
    const connection = await mysql.createConnection(dbConfig);
    console.log('MySQL connection established successfully!');
    return connection;
  } catch (err) {
    console.error('Failed to connect to MySQL:', err);
    throw err;
  }
}

// Use a connection pool for better performance in a real application
let dbConnection; // Single connection for simplicity in this example

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      spellcheck: false
    }
  })

  const loadViteDevServer = async () => {
    const url = 'http://localhost:5173';
    let retries = 0;
    const maxRetries = 20; // Maximum number of retries
    const retryInterval = 1000; // 1 second

    while (retries < maxRetries) {
      try {
        await mainWindow.loadURL(url);
        mainWindow.webContents.openDevTools();
        console.log('Vite server loaded successfully!');
        return; // Exit on success
      } catch (error) {
        console.log(`Failed to load ${url}: ${error.message}. Retrying (${retries + 1}/${maxRetries})...`);
        retries++;
        await new Promise(resolve => setTimeout(resolve, retryInterval));
      }
    }
    console.error(`Failed to load ${url} after ${maxRetries} retries. Giving up.`);
    app.quit(); // Exit if unable to connect after max retries
  };

  if (isDev) {
    // 开发环境下加载 Vite 开发服务器地址
    // Add an initial delay to give Vite time to start up before the first connection attempt.
    setTimeout(loadViteDevServer, 3000);
  } else {
    // 生产环境下加载打包后的文件
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

app.whenReady().then(async () => {
  // Establish database connection when the app is ready
  try {
    dbConnection = await createDbConnection();
  } catch (error) {
    console.error('Application startup failed due to database connection error.', error);
    app.quit();
    return;
  }

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
  if (dbConnection) {
    dbConnection.end();
    console.log('MySQL connection closed.');
  }
})

// IPC Handlers

// Fetch all users
ipcMain.handle('fetch-users', async (event) => {
  try {
    const [rows] = await dbConnection.query('SELECT id, name FROM team_user');
    return { success: true, data: rows };
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return { success: false, message: error.message };
  }
});

// Add a new user
ipcMain.handle('add-user', async (event, userName) => {
  try {
    const [result] = await dbConnection.query('INSERT INTO team_user (name) VALUES (?)', [userName]);
    return { success: true, id: result.insertId };
  } catch (error) {
    console.error('Failed to add user:', error);
    return { success: false, message: error.message };
  }
});

// Delete a user
ipcMain.handle('delete-user', async (event, userId) => {
  try {
    const [result] = await dbConnection.query('DELETE FROM team_user WHERE id = ?', [userId]);
    if (result.affectedRows > 0) {
      return { success: true };
    } else {
      return { success: false, message: 'User not found.' };
    }
  } catch (error) {
    console.error('Failed to delete user:', error);
    return { success: false, message: error.message };
  }
});

// Fetch scripts with pagination and search
ipcMain.handle('fetch-scripts', async (event, { page, pageSize, searchParams }) => {
  try {
    let query = 'SELECT id, name, description, script_type, related_tables, owner, create_time, update_time FROM team_sql WHERE 1=1';
    let countQuery = 'SELECT COUNT(*) as total FROM team_sql WHERE 1=1';
    const queryParams = [];

    if (searchParams.name) {
      query += ' AND name LIKE ?';
      countQuery += ' AND name LIKE ?';
      queryParams.push(`%${searchParams.name}%`);
    }
    if (searchParams.description) {
      query += ' AND description LIKE ?';
      countQuery += ' AND description LIKE ?';
      queryParams.push(`%${searchParams.description}%`);
    }
    if (searchParams.owner) {
      query += ' AND owner LIKE ?';
      countQuery += ' AND owner LIKE ?';
      queryParams.push(`%${searchParams.owner}%`);
    }
    if (searchParams.content) {
      query += ' AND content LIKE ?';
      countQuery += ' AND content LIKE ?';
      queryParams.push(`%${searchParams.content}%`);
    }
    if (searchParams.script_type) {
      query += ' AND script_type = ?';
      countQuery += ' AND script_type = ?';
      queryParams.push(searchParams.script_type);
    }

    // Get total count first
    const [countRows] = await dbConnection.query(countQuery, queryParams);
    const total = countRows[0].total;

    // Add pagination
    const offset = (page - 1) * pageSize;
    query += ' ORDER BY update_time DESC LIMIT ? OFFSET ?';
    queryParams.push(pageSize, offset);

    const [rows] = await dbConnection.query(query, queryParams);

    // Map rows to plain objects to ensure serializability
    const serializableRows = rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      script_type: row.script_type,
      related_tables: row.related_tables,
      owner: row.owner,
      url: row.url,
      create_time: row.create_time ? row.create_time.toISOString() : null, // Convert Date objects to ISO strings
      update_time: row.update_time ? row.update_time.toISOString() : null
    }));

    return { success: true, data: serializableRows, total };
  } catch (error) {
    console.error('Failed to fetch scripts:', error);
    return { success: false, message: error.message };
  }
});

// Fetch distinct script types
ipcMain.handle('fetch-script-types', async (event) => {
  try {
    const [rows] = await dbConnection.query('SELECT DISTINCT script_type FROM team_sql');
    return { success: true, data: rows.map(row => row.script_type) };
  } catch (error) {
    console.error('Failed to fetch distinct script types:', error);
    return { success: false, message: error.message };
  }
});

// Fetch owners from team_user
ipcMain.handle('fetch-owners', async (event) => {
  try {
    const [rows] = await dbConnection.query('SELECT name FROM team_user');
    return { success: true, data: rows.map(row => row.name) };
  } catch (error) {
    console.error('Failed to fetch owners:', error);
    return { success: false, message: error.message };
  }
});

// Handle add script
ipcMain.handle('add-script', async (event, script) => {
  try {
    const [result] = await dbConnection.execute(
      'INSERT INTO team_sql (name, description, script_type, content, related_tables, owner, create_time, update_time) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())',
      [script.name, script.description, script.script_type, script.content, script.related_tables, script.owner]
    );
    return { success: true, id: result.insertId };
  } catch (error) {
    console.error('Error adding script:', error);
    return { success: false, message: error.message };
  }
});

// Handle delete script
ipcMain.handle('delete-script', async (event, id) => {
  try {
    const [result] = await dbConnection.execute(
      'DELETE FROM team_sql WHERE id = ?',
      [id]
    );
    return { success: result.affectedRows > 0 };
  } catch (error) {
    console.error('Error deleting script:', error);
    return { success: false, message: error.message };
  }
});

// Handle update script
ipcMain.handle('update-script', async (event, script) => {
  try {
    const [result] = await dbConnection.execute(
      'UPDATE team_sql SET name = ?, description = ?, script_type = ?, content = ?, related_tables = ?, owner = ?, update_time = NOW() WHERE id = ?',
      [script.name, script.description, script.script_type, script.content, script.related_tables, script.owner, script.id]
    );
    return { success: result.affectedRows > 0 };
  } catch (error) {
    console.error('Error updating script:', error);
    return { success: false, message: error.message };
  }
});

// Fetch script detail
ipcMain.handle('fetch-script-detail', async (event, scriptId) => {
  try {
    const query = 'SELECT id, name, description, script_type, related_tables, owner, content, create_time, update_time FROM team_sql WHERE id=?';
    const [rows] = await dbConnection.query(query, [scriptId]);
    if (rows.length > 0) {
      const row = rows[0];
      // 确保时间字段为字符串
      row.create_time = row.create_time ? row.create_time.toISOString() : null;
      row.update_time = row.update_time ? row.update_time.toISOString() : null;
      return { success: true, data: row };
    } else {
      return { success: false, message: 'Script not found.' };
    }
  } catch (error) {
    console.error('Failed to fetch script detail:', error);
    return { success: false, message: error.message };
  }
});

// Fetch tables with pagination and search
// 获取所有可关联的表
ipcMain.handle('fetch-table-related-tables', async (event) => {
  try {
    const [rows] = await dbConnection.query('SELECT db_tbl FROM team_table');
    return { success: true, data: rows.map(row => row.db_tbl) };
  } catch (error) {
    console.error('Failed to fetch related tables:', error);
    return { success: false, message: error.message };
  }
});

// 修改获取表的查询，添加关联表信息
ipcMain.handle('fetch-tables', async (event, { page = 1, pageSize = 20, tbl, tbl_desc, owner }) => {
  try {
    let query = 'SELECT t.id, t.db_tbl, t.db, t.tbl, t.create_sql_name, t.create_sql, t.insert_sql_name, t.insert_sql, t.tbl_desc, t.owner, t.create_time, t.update_time, GROUP_CONCAT(d.depend_on) as related_table FROM team_table t LEFT JOIN team_table_dependencies d ON t.db_tbl = d.item WHERE 1=1';
    let countQuery = 'SELECT COUNT(DISTINCT t.id) as total FROM team_table t LEFT JOIN team_table_dependencies d ON t.db_tbl = d.item WHERE 1=1';
    const queryParams = [];
    const countParams = [];

    if (tbl) {
      query += ' AND t.tbl LIKE ?';
      countQuery += ' AND t.tbl LIKE ?';
      queryParams.push(`%${tbl}%`);
      countParams.push(`%${tbl}%`);
    }
    if (tbl_desc) {
      query += ' AND t.tbl_desc LIKE ?';
      countQuery += ' AND t.tbl_desc LIKE ?';
      queryParams.push(`%${tbl_desc}%`);
      countParams.push(`%${tbl_desc}%`);
    }
    if (owner) {
      query += ' AND t.owner LIKE ?';
      countQuery += ' AND t.owner LIKE ?';
      queryParams.push(`%${owner}%`);
      countParams.push(`%${owner}%`);
    }

    query += ' GROUP BY t.id';

    // Get total count first
    const [countRows] = await dbConnection.query(countQuery, countParams);
    const total = countRows[0].total;

    // Add pagination
    const offset = (page - 1) * pageSize;
    query += ' LIMIT ? OFFSET ?';
    queryParams.push(pageSize, offset);

    const [rows] = await dbConnection.query(query, queryParams);
    // Map rows to plain objects to ensure serializability
    const serializableRows = rows.map(row => ({
      id: row.id,
      db_tbl: row.db_tbl,
      db: row.db,
      tbl: row.tbl,
      create_sql_name: row.create_sql_name,
      create_sql: row.create_sql,
      insert_sql_name: row.insert_sql_name,
      insert_sql: row.insert_sql,
      tbl_desc: row.tbl_desc,
      owner: row.owner,
      related_table: row.related_table ? row.related_table.split(',') : [],
      create_time: row.create_time ? row.create_time.toISOString() : null,
      update_time: row.update_time ? row.update_time.toISOString() : null
    }));

    return { success: true, data: serializableRows, total };
  } catch (error) {
    console.error('Failed to fetch tables:', error);
    return { success: false, message: error.message };
  }
});

// 修改创建表的处理，添加依赖关系处理
ipcMain.handle('create-table', async (event, table) => {
  try {
    await dbConnection.beginTransaction();

    const [result] = await dbConnection.execute(
      'INSERT INTO team_table (db_tbl, db, tbl, create_sql_name, insert_sql_name, tbl_desc, owner, create_time, update_time) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
      [table.db_tbl, table.db, table.tbl, table.create_sql_name, table.insert_sql_name, table.tbl_desc, table.owner]
    );

    // 处理关联表
    if (table.related_table && table.related_table.length > 0) {
      for (const relatedTable of table.related_table) {
        await dbConnection.execute(
          'INSERT INTO team_table_dependencies (item, depend_on) VALUES (?, ?)',
          [table.db_tbl, relatedTable]
        );
      }
    }

    await dbConnection.commit();
    return { success: true, id: result.insertId };
  } catch (error) {
    await dbConnection.rollback();
    console.error('Error creating table:', error);
    return { success: false, message: error.message };
  }
});

// 修改更新表的处理，添加依赖关系处理
ipcMain.handle('update-table', async (event, table) => {
  try {
    await dbConnection.beginTransaction();

    const [result] = await dbConnection.execute(
      'UPDATE team_table SET db_tbl=?, db=?, tbl=?, create_sql_name=?, create_sql=?, insert_sql_name=?, insert_sql=?, tbl_desc=?, owner=?, update_time=NOW() WHERE id=?',
      [table.db_tbl, table.db, table.tbl, table.create_sql_name, table.create_sql, table.insert_sql_name, table.insert_sql, table.tbl_desc, table.owner, table.id]
    );

    // 删除旧的依赖关系
    await dbConnection.execute('DELETE FROM team_table_dependencies WHERE item = ?', [table.db_tbl]);

    // 添加新的依赖关系
    if (table.related_table && table.related_table.length > 0) {
      for (const relatedTable of table.related_table) {
        await dbConnection.execute(
          'INSERT INTO team_table_dependencies (item, depend_on) VALUES (?, ?)',
          [table.db_tbl, relatedTable]
        );
      }
    }

    await dbConnection.commit();
    return { success: result.affectedRows > 0 };
  } catch (error) {
    await dbConnection.rollback();
    console.error('Error updating table:', error);
    return { success: false, message: error.message };
  }
});

// 修改删除表的处理，添加依赖关系处理
ipcMain.handle('delete-table', async (event, id) => {
  try {
    await dbConnection.beginTransaction();

    // 获取表的db_tbl
    const [rows] = await dbConnection.query('SELECT db_tbl FROM team_table WHERE id = ?', [id]);
    if (rows.length === 0) {
      throw new Error('Table not found');
    }
    const db_tbl = rows[0].db_tbl;

    // 删除依赖关系
    await dbConnection.execute('DELETE FROM team_table_dependencies WHERE item = ? OR depend_on = ?', [db_tbl, db_tbl]);

    // 删除表记录
    const [result] = await dbConnection.execute('DELETE FROM team_table WHERE id = ?', [id]);

    await dbConnection.commit();
    return { success: result.affectedRows > 0 };
  } catch (error) {
    await dbConnection.rollback();
    console.error('Error deleting table:', error);
    return { success: false, message: error.message };
  }
});

// 分页+条件查询 team_api
ipcMain.handle('fetch-apis', async (event, { page = 1, pageSize = 20, module, top_module, sub_module, developer, related_table }) => {
  try {
    console.log('接收到的fetch-apis参数:', { page, pageSize, module, top_module, sub_module, developer, related_table });
    let query = 'SELECT a.id, a.module, a.top_module, a.sub_module, a.url, a.content, a.script, a.suggestion, a.remark, a.developer, a.progress, a.create_time, a.update_time, GROUP_CONCAT(t.db_tbl) as related_table FROM team_api a LEFT JOIN team_table_dependencies d ON a.sub_module = d.item LEFT JOIN team_table t ON d.depend_on = t.db_tbl WHERE 1=1 ';
    let countQuery = 'SELECT COUNT(DISTINCT a.id) as total FROM team_api a LEFT JOIN team_table_dependencies d ON a.sub_module = d.item LEFT JOIN team_table t ON d.depend_on = t.db_tbl WHERE 1=1';
    const queryParams = [];
    const countParams = [];
    if (module) {
      query += ' AND a.module LIKE ?';
      countQuery += ' AND a.module LIKE ?';
      queryParams.push(`%${module}%`);
      countParams.push(`%${module}%`);
    }
    if (top_module) {
      query += ' AND a.top_module LIKE ?';
      countQuery += ' AND a.top_module LIKE ?';
      queryParams.push(`%${top_module}%`);
      countParams.push(`%${top_module}%`);
    }
    if (sub_module) {
      query += ' AND a.sub_module LIKE ?';
      countQuery += ' AND a.sub_module LIKE ?';
      queryParams.push(`%${sub_module}%`);
      countParams.push(`%${sub_module}%`);
    }
    if (developer) {
      query += ' AND a.developer LIKE ?';
      countQuery += ' AND a.developer LIKE ?';
      queryParams.push(`%${developer}%`);
      countParams.push(`%${developer}%`);
    }
    // 即使related_table为空数组，也应该包含在查询中
    if (related_table && Array.isArray(related_table)) {
      if (related_table.length > 0) {
        // 处理非空数组类型的related_table
        const tableConditions = related_table.map(() => 't.db_tbl LIKE ?').join(' OR ');
        query += ' AND (' + tableConditions + ')';
        countQuery += ' AND (' + tableConditions + ')';
        related_table.forEach(table => {
          queryParams.push(`%${table}%`);
          countParams.push(`%${table}%`);
        });
      }
    } else if (related_table) {
      // 处理单个值的related_table
      query += ' AND t.db_tbl LIKE ?';
      countQuery += ' AND t.db_tbl LIKE ?';
      queryParams.push(`%${related_table}%`);
      countParams.push(`%${related_table}%`);
    }
    // Group by api id
    query += ' GROUP BY a.id';
    console.log('构建的查询语句:', query);
    console.log('查询参数:', queryParams);
    // Get total count first
    const [countRows] = await dbConnection.query(countQuery, countParams);
    const total = countRows[0].total;
    console.log('查询到的总记录数:', total);
    // Add sorting
    query += ' ORDER BY a.update_time DESC';
    // Add pagination
    const offset = (page - 1) * pageSize;
    query += ' LIMIT ? OFFSET ?';
    queryParams.push(pageSize, offset);
    const [rows] = await dbConnection.query(query, queryParams);
    console.log('查询到的原始数据行数:', rows.length);
    const serializableRows = rows.map(row => ({
      ...row,
      // 确保related_table是数组类型
      related_table: row.related_table ? row.related_table.split(',') : [],
      create_time: row.create_time ? row.create_time.toISOString() : null,
      update_time: row.update_time ? row.update_time.toISOString() : null
    }));
    console.log('序列化后的数据行数:', serializableRows.length);
    return { success: true, data: serializableRows, total };
  } catch (error) {
    console.error('Failed to fetch apis:', error);
    return { success: false, message: error.message };
  }
});

// 新增 team_api
ipcMain.handle('create-api', async (event, api) => {
  try {
    // 开始事务
    await dbConnection.beginTransaction();
    // 插入 API 记录
    const [result] = await dbConnection.execute(
      'INSERT INTO team_api (module, top_module, sub_module, suggestion, remark, developer, progress, script, create_time, update_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
      [api.module, api.top_module, api.sub_module, api.suggestion, api.remark, api.developer, api.progress, api.script]
    );
    // 处理关联表
    if (api.related_table && api.related_table.length > 0) {
      // 插入关联关系
      for (const tableName of api.related_table) {
        await dbConnection.execute(
          'INSERT INTO team_table_dependencies (item, depend_on) VALUES (?, ?)',
          [api.sub_module, tableName]
        );
      }
    }
    // 提交事务
    await dbConnection.commit();
    return { success: true, id: result.insertId };
  } catch (error) {
    // 回滚事务
    await dbConnection.rollback();
    console.error('Error creating api:', error);
    return { success: false, message: error.message };
  }
});

// 编辑 team_api
ipcMain.handle('update-api', async (event, api) => {
  try {
    console.log('Updating API with id:', api.id);
    // 开始事务
    await dbConnection.beginTransaction();
    // 保存旧的 sub_module
    console.log('Fetching old sub_module for API id:', api.id);
    const [oldApi] = await dbConnection.query('SELECT sub_module FROM team_api WHERE id = ?', [api.id]);
    console.log('Old API data:', oldApi);
    const oldSubModule = oldApi.length > 0 ? oldApi[0].sub_module : null;
    // 更新 API 记录
    console.log('Updating API record...');
    const [result] = await dbConnection.execute(
      'UPDATE team_api SET module=?, top_module=?, sub_module=?, suggestion=?, remark=?, developer=?, progress=?, script=?, update_time=NOW() WHERE id=?',
      [api.module, api.top_module, api.sub_module, api.suggestion, api.remark, api.developer, api.progress, api.script, api.id]
    );
    console.log('Update result:', result);
    // 删除旧的关联关系
    if (oldSubModule) {
      console.log('Deleting old dependencies for sub_module:', oldSubModule);
      await dbConnection.execute('DELETE FROM team_table_dependencies WHERE item = ?', [oldSubModule]);
      console.log('Old dependencies deleted');
    }
    // 处理新的关联表
    console.log('Related tables:', api.related_table);
    if (api.related_table && api.related_table.length > 0) {
      // 插入关联关系
      console.log('Inserting new dependencies...');
      for (const tableName of api.related_table) {
        console.log('Inserting dependency for table:', tableName);
        await dbConnection.execute(
          'INSERT INTO team_table_dependencies (item, depend_on) VALUES (?, ?)',
          [api.sub_module, tableName]
        );
      }
      console.log('New dependencies inserted');
    }
    // 提交事务
    await dbConnection.commit();
    return { success: result.affectedRows > 0 };
  } catch (error) {
    // 回滚事务
    await dbConnection.rollback();
    console.error('Error updating api:', error);
    return { success: false, message: error.message };
  }
});

// 删除 team_api
ipcMain.handle('delete-api', async (event, id) => {
  try {
    const [result] = await dbConnection.execute(
      'DELETE FROM team_api WHERE id = ?',
      [id]
    );
    return { success: result.affectedRows > 0 };
  } catch (error) {
    console.error('Error deleting api:', error);
    return { success: false, message: error.message };
  }
});

// 获取所有研发负责人（team_user.name）
ipcMain.handle('fetch-api-developers', async () => {
  try {
    const [rows] = await dbConnection.query('SELECT name FROM team_user');
    return { success: true, data: rows.map(row => row.name) };
  } catch (error) {
    console.error('Failed to fetch api developers:', error);
    return { success: false, message: error.message };
  }
});

// 获取所有关联表（team_table.db_tbl）
ipcMain.handle('fetch-api-related-tables', async () => {
  try {
    const [rows] = await dbConnection.query('SELECT db_tbl FROM team_table');
    return { success: true, data: rows.map(row => row.db_tbl) };
  } catch (error) {
    console.error('Failed to fetch api related tables:', error);
    return { success: false, message: error.message };
  }
});

// 获取所有脚本名称，支持模糊搜索
ipcMain.handle('fetch-sql-names', async (event, query) => {
  try {
    let sql = 'SELECT name FROM team_sql';
    const params = [];
    if (query) {
      sql += ' WHERE name LIKE ?';
      params.push(`%${query}%`);
    }
    const [rows] = await dbConnection.query(sql, params);
    return { success: true, data: rows.map(row => row.name) };
  } catch (error) {
    console.error('Failed to fetch sql names:', error);
    return { success: false, message: error.message };
  }
});

// 通过脚本名称获取 content
ipcMain.handle('fetch-sql-content-by-name', async (event, name) => {
  try {
    const [rows] = await dbConnection.query('SELECT content FROM team_sql WHERE name = ?', [name]);
    if (rows.length > 0) {
      return { success: true, content: rows[0].content };
    } else {
      return { success: false, message: 'Not found' };
    }
  } catch (error) {
    console.error('Failed to fetch sql content by name:', error);
    return { success: false, message: error.message };
  }
});

// Fetch table scatter data
ipcMain.handle('fetch-table-scatter-data', async (event) => {
  try {
    const [rows] = await dbConnection.query('select db, tbl from team_table');
    return rows;
  } catch (error) {
    console.error('Failed to fetch table scatter data:', error);
    return [];
  }
});

// Fetch table db pie data
ipcMain.handle('fetch-table-db-pie-data', async (event) => {
  try {
    const [rows] = await dbConnection.query('select db, count(1) as value from team_table group by db');
    return rows;
  } catch (error) {
    console.error('Failed to fetch table db pie data:', error);
    return [];
  }
});

// Fetch table metadata
ipcMain.handle('fetch-table-metadata', async (event, params) => {
  try {
    let sql = 'SELECT * FROM team_table_metadata WHERE 1=1';
    const queryParams = [];
    if (params.data_date) {
      sql += ' AND data_date = ?';
      queryParams.push(params.data_date);
    }
    if (params.tbl) {
      sql += ' AND tbl LIKE ?';
      queryParams.push(`%${params.tbl}%`);
    }
    sql += ' ORDER BY insert_time DESC LIMIT 200';
    const [rows] = await dbConnection.query(sql, queryParams);
    return rows;
  } catch (error) {
    console.error('Failed to fetch table metadata:', error);
    return [];
  }
});

