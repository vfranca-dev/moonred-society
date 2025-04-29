// config/db.js
const { Pool } = require('pg');

console.log('[DB_CONFIG] Configurando pool de conexão...');

const pool = new Pool({
    // --- Suas opções de conexão aqui (usando .env) ---
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
    // Adicione outras opções como ssl se necessário:
    // ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

// Teste de conexão inicial
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('[DB_CONFIG] Erro ao conectar ao banco de dados PostgreSQL:', err);
  } else {
    console.log('[DB_CONFIG] Conexão inicial com o banco de dados PostgreSQL estabelecida com sucesso!');
  }
});

module.exports = {
    query: (text, params) => pool.query(text, params),
    connect: () => pool.connect() // Exporta a função connect do pool
};