// server.js
require('dotenv').config();

const express = require('express');
const path = require('path');
const session = require('express-session');
const passport = require('passport');
const flash = require('connect-flash');
const methodOverride = require('method-override');

require('./config/db');
require('./config/passport').configurePassport(passport);

const authRoutes = require('./routes/auth');
const eldenRingRoutes = require('./routes/eldenring');
const mainRoutes = require('./routes/main');

const app = express();
// --- ADICIONADO: Configuração para confiar no proxy reverso do Render ---
// Isso é importante para 'cookie.secure' funcionar corretamente
app.set('trust proxy', 1); // Confia no primeiro hop do proxy
// --- FIM DA ADIÇÃO ---

const PORT = process.env.PORT || 3000; // Render define PORT automaticamente

// Configurações do App
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(methodOverride('_method'));

// Configurações de Sessão, Passport, Flash
app.use(session({
    secret: process.env.SESSION_SECRET || 'fallback_secret_key_for_dev', // Use a variável de ambiente!
    resave: false,
    saveUninitialized: false, // Não salva sessões não modificadas/anônimas
    cookie: {
        secure: process.env.NODE_ENV === 'production', // true em produção (Render)
        httpOnly: true, // Cookie não acessível via JS no cliente
        sameSite: 'lax', // Boa proteção CSRF padrão
        maxAge: 1000 * 60 * 60 * 24 // Opcional: Expira em 1 dia
    }
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// Middleware para variáveis locais
app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    res.locals.user = req.user || null; // Passa user para todas as views
    res.locals.currentUrl = req.originalUrl; // Opcional: passa a URL atual
    next();
});

// --- Montagem das Rotas ---
app.use('/auth', authRoutes);
app.use('/game/elden-ring', eldenRingRoutes);
app.use('/', mainRoutes); // Trata '/', '/search', '/updates', etc.

// Middlewares de erro (404 e 500)
app.use((req, res, next) => { res.status(404).render('error', { pageTitle: 'Page Not Found', errorCode: 404, errorMessage: "Sorry, the page you're looking for doesn't exist.", user: req.user }); });
app.use((err, req, res, next) => { console.error("Unhandled Error:", err); res.status(err.status || 500).render('error', { pageTitle: 'Server Error', errorCode: err.status || 500, errorMessage: process.env.NODE_ENV === 'production' ? 'Something went wrong on our end.' : err.message, user: req.user }); });

app.listen(PORT, () => { console.log(`Servidor iniciado na porta ${PORT}. Ambiente: ${process.env.NODE_ENV}`); });