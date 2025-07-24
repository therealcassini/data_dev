const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const isDev = process.env.NODE_ENV === 'development'
const mysql = require('mysql2/promise')

// const dbConfig = {
//     host: 'cassini.hk',
//     port: 3333,
//     database: 'data_dev_hk',
//     user: 'root',
//     password: 'happy_cassini2025'
// };


const dbConfig = {
    host: '192.168.0.97',
    port: 8801,
    database: 'data_dev',
    user: 'dbadmin01',
    password: 'YyiUO1P5dFqUJIX&'
};


// Create a single connection instead of a pool
let connection = null;

// Function to get a connection
async function getConnection() {
    if (connection) {
        try {
            await connection.ping();
            return connection;
        } catch (err) {
            console.error('Connection ping failed, creating new connection:', err);
        }
    }
    
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('MySQL connection created successfully!');
        return connection;
    } catch (err) {
        console.error('Failed to create connection:', err);
        throw err;
    }
}

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

app.whenReady().then(() => {
  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

// IPC Handlers

// 分析表依赖关系
ipcMain.handle('analyze-dependencies', async (event, tableName) => {
  try {
    console.log('开始分析依赖关系，表名:', tableName);
    // 递归查询依赖的表和关系
    const dependenciesData = {
      nodes: [],
      links: []
    };
    const maxDepth = 10; // 设置最大递归深度
    await findDependencies(tableName, dependenciesData, 0, maxDepth);
    console.log('依赖关系分析结果:', dependenciesData);
    return { success: true, data: dependenciesData };
  } catch (error) {
    console.error('Failed to analyze dependencies:', error);
    return { success: false, message: error.message };
  }
});

// 递归查找依赖的表和关系
async function findDependencies(tableName, dependenciesData, currentDepth, maxDepth) {
  // 检查递归深度
  if (currentDepth > maxDepth) {
    console.warn(`Reached maximum recursion depth (${maxDepth}) for table: ${tableName}`);
    return;
  }

  // 确保当前表在节点中
  if (!dependenciesData.nodes.includes(tableName)) {
    dependenciesData.nodes.push(tableName);
  }

  try {
    const connection = await getConnection();

      // 查找直接依赖的表
      const [rows] = await connection.query('SELECT depend_on FROM team_table_dependencies WHERE item = ?', [tableName]);
      
      for (const row of rows) {
        const dependentTable = row.depend_on;
        // 添加依赖关系
        dependenciesData.links.push({
          source: tableName,
          target: dependentTable
        });

        if (!dependenciesData.nodes.includes(dependentTable)) {
          dependenciesData.nodes.push(dependentTable);
          // 递归查找依赖的表的依赖
          await findDependencies(dependentTable, dependenciesData, currentDepth + 1, maxDepth);
        }
      }
  } catch (error) {
    console.error(`Failed to find dependencies for table ${tableName}:`, error);
    throw error;
  }
}

// 分析被依赖关系
ipcMain.handle('analyze-dependent', async (event, tableName) => {
  try {
    console.log('开始分析被依赖关系，表名:', tableName);
    // 递归查询被依赖的表和关系
    const dependentsData = { 
      nodes: [],
      links: []
    };
    await findDependents(tableName, dependentsData);
    console.log('被依赖关系分析结果:', dependentsData);
    return { success: true, data: dependentsData };
  } catch (error) {
    console.error('Failed to analyze dependents:', error);
    return { success: false, message: error.message };
  }
});

// 获取全部依赖数据
ipcMain.handle('get-all-dependencies', async (event) => {
  try {
    console.log('开始获取全部依赖数据');
    // 查询team_table_dependencies表中的所有数据
    const connection = await getConnection();
      const [rows] = await connection.query('SELECT item as table_name, depend_on as dependent_table FROM team_table_dependencies');
      console.log('全部依赖数据获取成功，共', rows.length, '条记录');
      return { success: true, data: rows };
  } catch (error) {
    console.error('Failed to get all dependencies:', error);
    return { success: false, message: error.message };
  }
});

// 处理日志记录相关的API

// 获取日志记录列表
ipcMain.handle('fetch-notes', async (event, params) => {
  try {
    const { page, pageSize, searchParams } = params;
    const offset = (page - 1) * pageSize;
    let query = 'SELECT * FROM team_notes WHERE 1=1';
    const queryParams = [];

    // 处理搜索参数
    if (searchParams.title) {
      query += ' AND title LIKE ?';
      queryParams.push(`%${searchParams.title}%`);
    }

    if (searchParams.created_at && searchParams.created_at.length === 2) {
      query += ' AND created_at BETWEEN ? AND ?';
      queryParams.push(searchParams.created_at[0], searchParams.created_at[1] + ' 23:59:59');
    }

    // 添加排序和分页
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    queryParams.push(pageSize, offset);

    const connection = await getConnection();
    const [rows] = await connection.query(query, queryParams);

    // 获取总数
    const countQuery = 'SELECT COUNT(*) as count FROM team_notes WHERE 1=1';
    const [countRows] = await connection.query(countQuery, queryParams.slice(0, -2));
    const total = countRows[0].count;

    return { success: true, data: rows, total };
  } catch (error) {
    console.error('Failed to fetch notes:', error);
    return { success: false, message: error.message };
  }
});

// 添加新的日志记录
ipcMain.handle('add-note', async (event, note) => {
  try {
    const { title, content } = note;
    const connection = await getConnection();
    const [result] = await connection.query(
      'INSERT INTO team_notes (title, content) VALUES (?, ?)',
      [title, content]
    );
    return { success: true, data: { id: result.insertId, title, content } };
  } catch (error) {
    console.error('Failed to add note:', error);
    return { success: false, message: error.message };
  }
});

// 更新日志记录
ipcMain.handle('update-note', async (event, note) => {
  try {
    const { id, title, content } = note;
    const connection = await getConnection();
    await connection.query(
      'UPDATE team_notes SET title = ?, content = ? WHERE id = ?',
      [title, content, id]
    );
    return { success: true, message: '记录更新成功' };
  } catch (error) {
    console.error('Failed to update note:', error);
    return { success: false, message: error.message };
  }
});

// 删除日志记录
ipcMain.handle('delete-note', async (event, id) => {
  try {
    const connection = await getConnection();
    await connection.query('DELETE FROM team_notes WHERE id = ?', [id]);
    return { success: true, message: '记录删除成功' };
  } catch (error) {
    console.error('Failed to delete note:', error);
    return { success: false, message: error.message };
  }
});

// 递归查找依赖的表和关系
async function findDependencies(tableName, dependenciesData) {
  try {
    // 获取连接
    const connection = await getConnection();

    // 确保当前表在节点中
    if (!dependenciesData.nodes.includes(tableName)) {
      dependenciesData.nodes.push(tableName);
    }

    // 查找直接依赖的表
    const [rows] = await connection.query('SELECT depend_on FROM team_table_dependencies WHERE item = ?', [tableName]);
    
    for (const row of rows) {
      const dependentTable = row.depend_on;
      // 添加依赖关系
      dependenciesData.links.push({
        source: tableName,
        target: dependentTable
      });

      if (!dependenciesData.nodes.includes(dependentTable)) {
        dependenciesData.nodes.push(dependentTable);
        // 递归查找依赖的表的依赖
        await findDependencies(dependentTable, dependenciesData);
      }
    }
  } catch (error) {
    console.error('查找依赖关系失败:', error);
    throw error;
  }
}

// 递归查找被依赖的表和关系
async function findDependents(tableName, dependentsData, currentDepth = 0, maxDepth = 10) {
  // 检查递归深度
  if (currentDepth > maxDepth) {
    console.warn(`Reached maximum recursion depth (${maxDepth}) for table: ${tableName}`);
    return;
  }

  // 确保当前表在节点中
  if (!dependentsData.nodes.includes(tableName)) {
    dependentsData.nodes.push(tableName);
  }

  try {
    const connection = await getConnection();
      // 查找直接依赖当前表的表
      const [rows] = await connection.query('SELECT item FROM team_table_dependencies WHERE depend_on = ?', [tableName]);
      
      for (const row of rows) {
        const dependentTable = row.item;
        // 添加依赖关系
        dependentsData.links.push({
          source: dependentTable,
          target: tableName
        });

        if (!dependentsData.nodes.includes(dependentTable)) {
          dependentsData.nodes.push(dependentTable);
          // 递归查找被依赖的表的被依赖
          await findDependents(dependentTable, dependentsData, currentDepth + 1, maxDepth);
        }
      }
  } catch (error) {
    console.error(`Failed to find dependents for table ${tableName}:`, error);
    throw error;
  }
}

// Handle query-global-stats
ipcMain.handle('query-global-stats', async (event) => {
  try {
    console.log('开始查询全局统计数据');
    const connection = await getConnection();
      // 查询人员总数
      const [usersResult] = await connection.query('SELECT COUNT(*) as count FROM team_user');
      const usersCount = usersResult[0].count;
      console.log('人员总数:', usersCount);

      // 查询表总量
      const [tablesResult] = await connection.query('SELECT COUNT(*) as count FROM team_table');
      const tablesCount = tablesResult[0].count;
      console.log('表总量:', tablesCount);

      // 查询脚本总量
      const [scriptsResult] = await connection.query('SELECT COUNT(*) as count FROM team_sql');
      const scriptsCount = scriptsResult[0].count;
      console.log('脚本总量:', scriptsCount);

      // 查询接口总量
      const [apisResult] = await connection.query('SELECT COUNT(*) as count FROM team_api');
      const apisCount = apisResult[0].count;
      console.log('接口总量:', apisCount);

      return {
        success: true,
        data: [
          ['人员总数', usersCount],
          ['表总量', tablesCount],
          ['脚本总量', scriptsCount],
          ['接口总量', apisCount]
        ]
      };
  } catch (error) {
    console.error('Failed to query global stats:', error);
    return { success: false, message: error.message };
  }
});

// Fetch all users
ipcMain.handle('fetch-users', async (event) => {
  try {
    const connection = await getConnection();
    const [rows] = await connection.query('SELECT id, name FROM team_user');
    return { success: true, data: rows };
  } catch (error) {
    console.error('Failed to fetch users or get connection:', error);
    return { success: false, message: error.message };
  }
});

// Add a new user
ipcMain.handle('add-user', async (event, userName) => {
  try {
    const connection = await getConnection();
    const [result] = await connection.query('INSERT INTO team_user (name) VALUES (?)', [userName]);
    return { success: true, id: result.insertId };
  } catch (error) {
    console.error('Failed to add user or get connection:', error);
    return { success: false, message: error.message };
  }
});

// Delete a user
ipcMain.handle('delete-user', async (event, userId) => {
  try {
    const connection = await getConnection();
    const [result] = await connection.query('DELETE FROM team_user WHERE id = ?', [userId]);
    if (result.affectedRows > 0) {
      return { success: true };
    } else {
      return { success: false, message: 'User not found.' };
    }
  } catch (error) {
    console.error('Failed to delete user or get connection:', error);
    return { success: false, message: error.message };
  }
});

// Fetch scripts with pagination and search
ipcMain.handle('fetch-scripts', async (event, { page, pageSize, searchParams }) => {
  try {
    const connection = await getConnection();
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
    const [countRows] = await connection.query(countQuery, queryParams);
    const total = countRows[0].total;

    // Add pagination
    const offset = (page - 1) * pageSize;
    query += ' ORDER BY update_time DESC LIMIT ? OFFSET ?';
    queryParams.push(pageSize, offset);

    const [rows] = await connection.query(query, queryParams);

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
    console.error('Failed to fetch scripts or get connection:', error);
    return { success: false, message: error.message };
  }
});

// Fetch distinct script types
ipcMain.handle('fetch-script-types', async (event) => {
  try {
    const connection = await getConnection();
    const [rows] = await connection.query('SELECT DISTINCT script_type FROM team_sql');
    return { success: true, data: rows.map(row => row.script_type) };
  } catch (error) {
    console.error('Failed to fetch distinct script types or get connection:', error);
    return { success: false, message: error.message };
  }
});

// Fetch owners from team_user
ipcMain.handle('fetch-owners', async (event) => {
  try {
    const connection = await getConnection();
    const [rows] = await connection.query('SELECT name FROM team_user');
    return { success: true, data: rows.map(row => row.name) };
  } catch (error) {
    console.error('Failed to fetch owners or get connection:', error);
    return { success: false, message: error.message };
  }
});

// Handle add script
ipcMain.handle('add-script', async (event, script) => {
  try {
    const connection = await getConnection();
    const [result] = await connection.execute(
      'INSERT INTO team_sql (name, description, script_type, content, related_tables, owner, create_time, update_time) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())',
      [script.name, script.description, script.script_type, script.content, script.related_tables, script.owner]
    );
    return { success: true, id: result.insertId };
  } catch (error) {
    console.error('Error adding script or getting connection:', error);
    return { success: false, message: error.message };
  }
});

// Handle delete script
ipcMain.handle('delete-script', async (event, id) => {
  try {
    const connection = await getConnection();
    const [result] = await connection.execute(
      'DELETE FROM team_sql WHERE id = ?',
      [id]
    );
    return { success: result.affectedRows > 0 };
  } catch (error) {
    console.error('Error deleting script or getting connection:', error);
    return { success: false, message: error.message };
  }
});

// Handle update script
ipcMain.handle('update-script', async (event, script) => {
  try {
    const connection = await getConnection();
    const [result] = await connection.execute(
      'UPDATE team_sql SET name = ?, description = ?, script_type = ?, content = ?, related_tables = ?, owner = ?, update_time = NOW() WHERE id = ?',
      [script.name, script.description, script.script_type, script.content, script.related_tables, script.owner, script.id]
    );
    return { success: result.affectedRows > 0 };
  } catch (error) {
    console.error('Error updating script or getting connection:', error);
    return { success: false, message: error.message };
  }
});

// Fetch script detail
ipcMain.handle('fetch-script-detail', async (event, scriptId) => {
  try {
    const connection = await getConnection();
    const query = 'SELECT id, name, description, script_type, related_tables, owner, content, create_time, update_time FROM team_sql WHERE id=?';
    const [rows] = await connection.query(query, [scriptId]);
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
    console.error('Failed to fetch script detail or get connection:', error);
    return { success: false, message: error.message };
  }
});

// Fetch tables with pagination and search
// 获取所有可关联的表
ipcMain.handle('fetch-table-related-tables', async (event) => {
  try {
    const connection = await getConnection();
    const [rows] = await connection.query('SELECT db_tbl FROM team_table');
    return { success: true, data: rows.map(row => row.db_tbl) };
  } catch (error) {
    console.error('Failed to fetch related tables or get connection:', error);
    return { success: false, message: error.message };
  }
});

// 修改获取表的查询，添加关联表信息
ipcMain.handle('fetch-tables', async (event, { page = 1, pageSize = 20, tbl, tbl_desc, owner }) => {
  try {
    const connection = await getConnection();
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
    const [countRows] = await connection.query(countQuery, countParams);
    const total = countRows[0].total;

    //order by update_time desc 
    query += ' ORDER BY t.update_time DESC';

    // Add pagination
    const offset = (page - 1) * pageSize;
    query += ' LIMIT ? OFFSET ?';
    queryParams.push(pageSize, offset);

    const [rows] = await connection.query(query, queryParams);
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
    console.error('Failed to fetch tables or get connection:', error);
    return { success: false, message: error.message };
  }
});

// 修改创建表的处理，添加依赖关系处理
ipcMain.handle('create-table', async (event, table) => {
  try {
    const connection = await getConnection();
    try {
      await connection.beginTransaction();

      const [result] = await connection.execute(
        'INSERT INTO team_table (db_tbl, db, tbl, create_sql_name, insert_sql_name, tbl_desc, owner, create_time, update_time) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
        [table.db_tbl, table.db, table.tbl, table.create_sql_name, table.insert_sql_name, table.tbl_desc, table.owner]
      );

      // 处理关联表
      if (table.related_table && table.related_table.length > 0) {
        for (const relatedTable of table.related_table) {
          await connection.execute(
            'INSERT INTO team_table_dependencies (item, depend_on) VALUES (?, ?)',
            [table.db_tbl, relatedTable]
          );
        }
      }

      await connection.commit();
      return { success: true, id: result.insertId };
    } catch (error) {
      if (connection) {
        await connection.rollback();
      }
      console.error('Error creating table:', error);
      return { success: false, message: error.message };
    }
  } catch (error) {
    console.error('Failed to get connection:', error);
    return { success: false, message: error.message };
  }
});

// 修改更新表的处理，添加依赖关系处理
ipcMain.handle('update-table', async (event, table) => {
  try {
    const connection = await getConnection();
    await connection.beginTransaction();

    const [result] = await connection.execute(
      'UPDATE team_table SET db_tbl=?, db=?, tbl=?, create_sql_name=?, create_sql=?, insert_sql_name=?, insert_sql=?, tbl_desc=?, owner=?, update_time=NOW() WHERE id=?',
      [table.db_tbl, table.db, table.tbl, table.create_sql_name, table.create_sql, table.insert_sql_name, table.insert_sql, table.tbl_desc, table.owner, table.id]
    );

    // 删除旧的依赖关系
    await connection.execute('DELETE FROM team_table_dependencies WHERE item = ?', [table.db_tbl]);

    // 添加新的依赖关系
    if (table.related_table && table.related_table.length > 0) {
      for (const relatedTable of table.related_table) {
        await connection.execute(
          'INSERT INTO team_table_dependencies (item, depend_on) VALUES (?, ?)',
          [table.db_tbl, relatedTable]
        );
      }
    }

    await connection.commit();
    return { success: result.affectedRows > 0 };
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error('Error updating table or getting connection:', error);
    return { success: false, message: error.message };
  }
});

// 修改删除表的处理，添加依赖关系处理
ipcMain.handle('delete-table', async (event, id) => {
  try {
    const connection = await getConnection();
    await connection.beginTransaction();

    // 获取表的db_tbl
    const [rows] = await connection.query('SELECT db_tbl FROM team_table WHERE id = ?', [id]);
    if (rows.length === 0) {
      throw new Error('Table not found');
    }
    const db_tbl = rows[0].db_tbl;

    // 删除依赖关系
    await connection.execute('DELETE FROM team_table_dependencies WHERE item = ? OR depend_on = ?', [db_tbl, db_tbl]);

    // 删除表记录
    const [result] = await connection.execute('DELETE FROM team_table WHERE id = ?', [id]);

    await connection.commit();
    return { success: result.affectedRows > 0 };
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error('Error deleting table or getting connection:', error);
    return { success: false, message: error.message };
  }
});

// 分页+条件查询 team_api
ipcMain.handle('fetch-apis', async (event, { page = 1, pageSize = 20, module, top_module, sub_module, developer, related_table }) => {
  try {
    const connection = await getConnection();
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
    const [countRows] = await connection.query(countQuery, countParams);
    const total = countRows[0].total;
    console.log('查询到的总记录数:', total);
    // Add sorting
    query += ' ORDER BY a.update_time DESC';
    // Add pagination
    const offset = (page - 1) * pageSize;
    query += ' LIMIT ? OFFSET ?';
    queryParams.push(pageSize, offset);
    const [rows] = await connection.query(query, queryParams);
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
    console.error('Failed to get connection or execute query:', error);
    return { success: false, message: error.message };
  }
});

// 新增 team_api
ipcMain.handle('create-api', async (event, api) => {
  try {
    const connection = await getConnection();
    // 开始事务
    await connection.beginTransaction();
    // 插入 API 记录
    const [result] = await connection.execute(
      'INSERT INTO team_api (module, top_module, sub_module, url, content, suggestion, remark, developer, progress, script, create_time, update_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
      [api.module, api.top_module, api.sub_module, api.url, api.content, api.suggestion, api.remark, api.developer, api.progress, api.script]
    );
    // 处理关联表
    if (api.related_table && api.related_table.length > 0) {
      // 插入关联关系
      for (const tableName of api.related_table) {
        await connection.execute(
          'INSERT INTO team_table_dependencies (item, depend_on) VALUES (?, ?)',
          [api.sub_module, tableName]
        );
      }
    }
    // 提交事务
    await connection.commit();
    return { success: true, id: result.insertId };
  } catch (error) {
    // 回滚事务
    if (connection) {
      await connection.rollback();
    }
    console.error('Error creating api or getting connection:', error);
    return { success: false, message: error.message };
  }
});

// 编辑 team_api
ipcMain.handle('update-api', async (event, api) => {
  try {
    const connection = await getConnection();
    console.log('Updating API with id:', api.id);
    // 开始事务
    await connection.beginTransaction();
    // 保存旧的 sub_module
    console.log('Fetching old sub_module for API id:', api.id);
    const [oldApi] = await connection.query('SELECT sub_module FROM team_api WHERE id = ?', [api.id]);
    console.log('Old API data:', oldApi);
    const oldSubModule = oldApi.length > 0 ? oldApi[0].sub_module : null;
    // 更新 API 记录
    console.log('Updating API record...');
    const [result] = await connection.execute(
      'UPDATE team_api SET module=?, top_module=?, sub_module=?, url=?, content=?, suggestion=?, remark=?, developer=?, progress=?, script=?, update_time=NOW() WHERE id=?',
      [api.module, api.top_module, api.sub_module, api.url, api.content, api.suggestion, api.remark, api.developer, api.progress, api.script, api.id]
    );
    console.log('Update result:', result);
    // 删除旧的关联关系
    if (oldSubModule) {
      console.log('Deleting old dependencies for sub_module:', oldSubModule);
      await connection.execute('DELETE FROM team_table_dependencies WHERE item = ?', [oldSubModule]);
      console.log('Old dependencies deleted');
    }
    // 处理新的关联表
    console.log('Related tables:', api.related_table);
    if (api.related_table && api.related_table.length > 0) {
      // 插入关联关系
      console.log('Inserting new dependencies...');
      for (const tableName of api.related_table) {
        console.log('Inserting dependency for table:', tableName);
        await connection.execute(
          'INSERT INTO team_table_dependencies (item, depend_on) VALUES (?, ?)',
          [api.sub_module, tableName]
        );
      }
    }
    // 提交事务
    await connection.commit();
    return { success: result.affectedRows > 0 };
  } catch (error) {
    // 回滚事务
    if (connection) {
      await connection.rollback();
    }
    console.error('Error updating api or getting connection:', error);
    return { success: false, message: error.message };
  }
});

// 删除 team_api
ipcMain.handle('delete-api', async (event, id) => {
  try {
    const connection = await getConnection();
    const [result] = await connection.execute(
      'DELETE FROM team_api WHERE id = ?',
      [id]
    );
    return { success: result.affectedRows > 0 };
  } catch (error) {
    console.error('Failed to get connection or execute query:', error);
    return { success: false, message: error.message };
  }
});

// 获取所有研发负责人（team_user.name）
ipcMain.handle('fetch-api-developers', async () => {
  try {
    const connection = await getConnection();
    const [rows] = await connection.query('SELECT name FROM team_user');
    return { success: true, data: rows.map(row => row.name) };
  } catch (error) {
    console.error('Failed to fetch api developers or get connection:', error);
    return { success: false, message: error.message };
  }
});

// 获取所有关联表（team_table.db_tbl）
ipcMain.handle('fetch-api-related-tables', async () => {
  try {
    const connection = await getConnection();
    const [rows] = await connection.query('SELECT db_tbl FROM team_table');
    return { success: true, data: rows.map(row => row.db_tbl) };
  } catch (error) {
    console.error('Failed to fetch api related tables or get connection:', error);
    return { success: false, message: error.message };
  }
});

// 获取所有脚本名称，支持模糊搜索
ipcMain.handle('fetch-sql-names', async (event, query) => {
  try {
    const connection = await getConnection();
    let sql = 'SELECT name FROM team_sql';
    const params = [];
    if (query) {
      sql += ' WHERE name LIKE ?';
      params.push(`%${query}%`);
    }
    const [rows] = await connection.query(sql, params);
    return { success: true, data: rows.map(row => row.name) };
  } catch (error) {
    console.error('Failed to fetch sql names or get connection:', error);
    return { success: false, message: error.message };
  }
});

// 通过脚本名称获取 content
ipcMain.handle('fetch-sql-content-by-name', async (event, name) => {
  try {
    const connection = await getConnection();
    const [rows] = await connection.query('SELECT content FROM team_sql WHERE name = ?', [name]);
    if (rows.length > 0) {
      return { success: true, content: rows[0].content };
    } else {
      return { success: false, message: 'Not found' };
    }
  } catch (error) {
    console.error('Failed to fetch sql content by name or get connection:', error);
    return { success: false, message: error.message };
  }
});

// Fetch table scatter data
ipcMain.handle('fetch-table-scatter-data', async (event) => {
  try {
    const connection = await getConnection();
    const [rows] = await connection.query('select db, tbl from team_table');
    return rows;
  } catch (error) {
    console.error('Failed to fetch table scatter data or get connection:', error);
    return [];
  }
});

// Fetch table db pie data
ipcMain.handle('fetch-table-db-pie-data', async (event) => {
  try {
    const connection = await getConnection();
    const [rows] = await connection.query('select db, count(1) as value from team_table group by db');
    return rows;
  } catch (error) {
    console.error('Failed to fetch table db pie data or get connection:', error);
    return [];
  }
});

// Fetch table metadata
ipcMain.handle('fetch-table-metadata', async (event, params) => {
  try {
    const connection = await getConnection();
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
    const [rows] = await connection.query(sql, queryParams);
    return rows;
  } catch (error) {
    console.error('Failed to fetch table metadata or get connection:', error);
    return [];
  }
});

