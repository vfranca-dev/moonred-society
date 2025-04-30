// config/passport.js
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const db = require('./db');

// Função de middleware para verificar autenticação
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    req.flash('error_msg', 'Please log in to view that resource');
    res.redirect('/auth/login');
}

// Função para configurar as estratégias e serialização/deserialização do Passport
function configurePassport(passport) {
    console.log('[Passport Config] Configuring Passport strategies...');
    passport.use(
        new LocalStrategy({ usernameField: 'username' }, async (username, password, done) => {
            console.log(`[Passport Local] Attempting login for username: ${username}`);
            try {
                // Verifica se o username ou email foi fornecido (ajuste se necessário)
                // Esta query assume que 'username' é o campo usado no formulário
                const result = await db.query('SELECT * FROM users WHERE username = $1', [username]);
                const user = result.rows[0];

                console.log('[Passport Local] User found in DB:', user ? user.username : 'None'); // Log

                if (!user) {
                    console.log(`[Passport Local] User not found: ${username}. Calling done(null, false)`);
                    // Mensagem genérica pode ser melhor por segurança, mas para debug é ok ser específico
                    return done(null, false, { message: 'No user found with that username.' });
                }

                // Usuário encontrado, comparar senha
                console.log(`[Passport Local] Comparing password for user: ${user.username}`);
                bcrypt.compare(password, user.password_hash, (err, isMatch) => {
                    console.log('[Passport Local] bcrypt.compare - Error:', err, '| Is Match:', isMatch); // Log Resultado

                    if (err) {
                        console.error('[Passport Local] bcrypt error:', err);
                        return done(err); // Passa erro do bcrypt
                    }
                    if (isMatch) {
                        console.log(`[Passport Local] Password MATCH for ${user.username}. Calling done(null, user)`); // Log Sucesso
                        return done(null, user); // Autenticação bem-sucedida, passa o objeto user
                    } else {
                        console.log(`[Passport Local] Password NO MATCH for ${user.username}. Calling done(null, false)`); // Log Falha
                        return done(null, false, { message: 'Password incorrect.' }); // Senha incorreta
                    }
                });
            } catch (dbErr) {
                console.error('[Passport Local] DB Error during login attempt:', dbErr); // Log Erro DB
                return done(dbErr); // Passa erro do DB
            }
        })
    );

    passport.serializeUser((user, done) => {
        // Guarda apenas o ID do usuário na sessão
        console.log('[Passport Serialize] Serializing user ID:', user.user_id); // Log
        if (!user || typeof user.user_id === 'undefined') {
             console.error('[Passport Serialize] ERROR: User object or user_id is missing!', user);
             return done(new Error('Invalid user object for serialization'));
        }
        done(null, user.user_id);
    });

    passport.deserializeUser(async (id, done) => {
        // Busca o usuário completo no DB a cada requisição usando o ID da sessão
        console.log(`[Passport Deserialize] Attempting to deserialize user ID: ${id}`); // Log
        try {
            // Seleciona apenas os campos necessários para req.user
            const result = await db.query('SELECT user_id, username, email FROM users WHERE user_id = $1', [id]);
            const user = result.rows[0];

            if (!user) {
                 console.error(`[Passport Deserialize] User NOT FOUND in DB for ID: ${id}`); // Log
                 // Indica que o usuário da sessão não existe mais no DB
                 return done(null, false); // Ou pode passar um erro: done(new Error('User not found'));
            }
            console.log(`[Passport Deserialize] User FOUND and deserialized: ${user.username}`); // Log
            done(null, user); // Anexa o objeto user a req.user
        } catch (dbErr) {
            console.error(`[Passport Deserialize] DB Error for ID ${id}:`, dbErr); // Log Erro DB
            done(dbErr); // Passa erro do DB
        }
    });
    console.log('[Passport Config] Passport strategies configured.');
}

// Exporta um objeto contendo ambas as funções
module.exports = {
    configurePassport: configurePassport,
    ensureAuthenticated: ensureAuthenticated
};