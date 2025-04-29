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
    // --- CORREÇÃO APLICADA AQUI ---
    res.redirect('/auth/login'); // Aponta para a rota correta montada em server.js
    // --- FIM DA CORREÇÃO ---
}

// Função para configurar as estratégias e serialização/deserialização do Passport
function configurePassport(passport) {
    passport.use(
        new LocalStrategy({ usernameField: 'username' }, async (username, password, done) => {
            try {
                const result = await db.query('SELECT * FROM users WHERE username = $1', [username]);
                const user = result.rows[0];
                if (!user) {
                    console.log(`[Passport] Usuário não encontrado: ${username}`);
                    return done(null, false, { message: 'That username is not registered' });
                }
                bcrypt.compare(password, user.password_hash, (err, isMatch) => {
                    if (err) return done(err);
                    if (isMatch) {
                        console.log(`[Passport] Autenticado: ${username}`);
                        return done(null, user);
                    } else {
                        console.log(`[Passport] Senha incorreta para: ${username}`);
                        return done(null, false, { message: 'Password incorrect' });
                    }
                });
            } catch (err) {
                console.error('[Passport] Erro DB:', err);
                return done(err);
            }
        })
    );

    passport.serializeUser((user, done) => {
        done(null, user.user_id);
    });

    passport.deserializeUser(async (id, done) => {
        try {
            const result = await db.query('SELECT user_id, username, email FROM users WHERE user_id = $1', [id]);
            const user = result.rows[0];
            if (!user) {
                 return done(new Error(`User with ID ${id} not found`));
            }
            done(null, user);
        } catch (err) {
            done(err);
        }
    });
}

// Exporta um objeto contendo ambas as funções
module.exports = {
    configurePassport: configurePassport,
    ensureAuthenticated: ensureAuthenticated
};