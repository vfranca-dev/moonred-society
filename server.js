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

// Importa as rotas
const authRoutes = require('./routes/auth');
const eldenRingRoutes = require('./routes/eldenring');
const mainRoutes = require('./routes/main'); // Contém a rota GET '/' corrigida

const app = express();
const PORT = process.env.PORT || 3000;

// Configurações do App
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(methodOverride('_method'));

// Configurações de Sessão, Passport, Flash
app.use(session({ secret: process.env.SESSION_SECRET || 'fallback_secret_key', resave: false, saveUninitialized: false, cookie: { secure: process.env.NODE_ENV === 'production' } }));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// Middleware para variáveis locais
app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    // Alterado para passar o objeto user inteiro para res.locals,
    // assim o header.ejs pode usar `currentUser` ou `user` (vamos usar user no EJS)
    res.locals.user = req.user || null;
    // MANTIDO currentUser para compatibilidade se usado em outro lugar
    res.locals.currentUser = req.user || null;
    next();
});

// --- Montagem das Rotas ---
// REMOVIDO: app.get('/', ...) daqui
app.use('/auth', authRoutes);
app.use('/game/elden-ring', eldenRingRoutes);
// AGORA a requisição para '/' será tratada pela rota definida em mainRoutes
app.use('/', mainRoutes);

// Middlewares de erro (404 e 500)
app.use((req, res, next) => { res.status(404).render('error', { pageTitle: 'Page Not Found', errorCode: 404, errorMessage: "Sorry, the page you're looking for doesn't exist.", user: req.user }); }); // Passa user para página de erro
app.use((err, req, res, next) => { console.error("Unhandled Error:", err); res.status(err.status || 500).render('error', { pageTitle: 'Server Error', errorCode: err.status || 500, errorMessage: process.env.NODE_ENV === 'production' ? 'Something went wrong on our end.' : err.message, user: req.user }); }); // Passa user para página de erro

app.listen(PORT, () => { console.log(`Servidor iniciado na porta ${PORT}. Acesse http://localhost:${PORT}`); });