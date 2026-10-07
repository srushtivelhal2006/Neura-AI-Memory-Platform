const neo4j = require('neo4j-driver');
const env = require('./env');

let driver = null;

function getDriver() {
  if (!driver) {
    driver = neo4j.driver(
      env.neo4j.uri,
      neo4j.auth.basic(env.neo4j.user, env.neo4j.password),
      {
        maxConnectionPoolSize: 50,
        connectionAcquisitionTimeout: 10000,
        disableLosslessIntegers: true,
      }
    );
  }
  return driver;
}

function getSession(database = 'neo4j') {
  return getDriver().session({ database });
}

async function testConnection() {
  const session = getSession();
  try {
    const result = await session.run('RETURN 1 AS num');
    const num = result.records[0].get('num');
    console.log('✅ Neo4j connected, test query returned:', num);
    return true;
  } catch (err) {
    console.error('❌ Neo4j connection test failed:', err.message);
    return false;
  } finally {
    await session.close();
  }
}

async function close() {
  if (driver) {
    await driver.close();
    driver = null;
    console.log('Neo4j driver closed');
  }
}

module.exports = { getDriver, getSession, testConnection, close };
