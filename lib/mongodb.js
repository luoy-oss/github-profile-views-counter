const { MongoClient } = require('mongodb');

let client = null;
let db = null;

/**
 * 获取 MongoDB 数据库连接
 * 使用单例模式避免重复创建连接
 * @returns {Promise<Db>} MongoDB 数据库实例
 */
async function getDatabase() {
  if (db) {
    return db;
  }

  const uri = process.env.MONGODB_URI;
  
  if (!uri) {
    throw new Error('MONGODB_URI 环境变量未设置');
  }

  if (!client) {
    client = new MongoClient(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 10000,
    });
    
    await client.connect();
  }

  const dbName = process.env.MONGODB_DB_NAME || 'profile_views_counter';
  db = client.db(dbName);
  
  return db;
}

/**
 * 获取访客计数集合
 * @returns {Promise<Collection>} MongoDB 集合实例
 */
async function getCounterCollection() {
  const database = await getDatabase();
  return database.collection('counters');
}

/**
 * 关闭数据库连接
 */
async function closeConnection() {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}

module.exports = {
  getDatabase,
  getCounterCollection,
  closeConnection,
};
