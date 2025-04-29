// config/db.js
const { Pool } = require('pg');
require('dotenv').config(); // Garante que .env seja lido em desenvolvimento

console.log('[DB_CONFIG] Configurando pool de conexão...');

// Configuração baseada no ambiente
const isProduction = process.env.NODE_ENV === 'production';

const connectionConfig = {
    // Usa DATABASE_URL se estiver em produção (Render), senão usa variáveis DB_*
    connectionString: isProduction ? process.env.DATABASE_URL : undefined,
    user: isProduction ? undefined : process.env.DB_USER,
    host: isProduction ? undefined : process.env.DB_HOST,
    database: isProduction ? undefined : process.env.DB_DATABASE,
    password: isProduction ? undefined : process.env.DB_PASSWORD,
    port: isProduction ? undefined : (process.env.DB_PORT || 5432),

    // Configuração SSL: Necessária para o Render (e muitas outras hospedagens)
    // Em produção, requer SSL. Em dev, geralmente não.
    ssl: isProduction ? { rejectUnauthorized: false } : false
};

// Remove chaves indefinidas para usar connectionString corretamente
if (isProduction) {
    delete connectionConfig.user;
    delete connectionConfig.host;
    delete connectionConfig.database;
    delete connectionConfig.password;
    delete connectionConfig.port;
} else {
    delete connectionConfig.connectionString;
}

if (isProduction && !process.env.DATABASE_URL) {
     console.error("[DB_CONFIG] ERRO FATAL: NODE_ENV é 'production', mas DATABASE_URL não está definida!");
     // Em um cenário real, você poderia querer que a aplicação parasse aqui
     // process.exit(1);
}

const pool = new Pool(connectionConfig);

// Teste de conexão inicial (opcional, mas útil para debug)
pool.query('SELECT NOW()')
  .then(res => {
    console.log('[DB_CONFIG] Conexão inicial com o banco de dados PostgreSQL estabelecida com sucesso! Hora do servidor DB:', res.rows[0].now);
  })
  .catch(err => {
    console.error('[DB_CONFIG] Erro ao executar query de teste no banco de dados PostgreSQL:', err);
    // Exibe detalhes específicos do erro de conexão se disponíveis
    if (err.code) console.error(`[DB_CONFIG] Código do Erro: ${err.code}`);
    if (err.address) console.error(`[DB_CONFIG] Endereço Tentado: ${err.address}`);
    if (err.port) console.error(`[DB_CONFIG] Porta Tentada: ${err.port}`);
  });


module.exports = {
    query: (text, params) => pool.query(text, params),
    connect: () => pool.connect() // Exporta a função connect do pool
};