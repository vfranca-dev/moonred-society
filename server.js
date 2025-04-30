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
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(methodOverride('_method'));

app.use(session({
    secret: process.env.SESSION_SECRET || 'fallback_secret_key_for_dev',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60 * 24 // 1 dia
    }
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    res.locals.user = req.user || null;
    // Adiciona status de convidado para as views
    res.locals.isGuest = req.session.isGuest || false;
    res.locals.currentUrl = req.originalUrl;
    next();
});

// Rota de Boas-Vindas / Inicial
app.get('/', (req, res) => {
    // Se já logado OU é convidado, vai para o index
    if (req.isAuthenticated() || req.session.isGuest) {
        // Passa user/isGuest automaticamente pelos locals
        return res.render('index', {
            pageTitle: 'Home - Moonred Society'
        });
    }
    // Senão, mostra a página de boas-vindas/escolha
    res.render('welcome', {
        pageTitle: 'Welcome - Moonred Society'
    });
});

// Rota para marcar como convidado
app.post('/guest-login', (req, res) => {
    req.session.isGuest = true;
    // Não precisa de flash msg, apenas redireciona
    res.redirect('/'); // Vai para a home como convidado
});


app.use('/auth', authRoutes);
app.use('/game/elden-ring', eldenRingRoutes);
// Removido app.use('/', mainRoutes) pois '/' já está definida acima
// Monta as outras rotas de main.js (exceto '/')
app.use('/', mainRoutes);


app.use((req, res, next) => { res.status(404).render('error', { pageTitle: 'Page Not Found', errorCode: 404, errorMessage: "Sorry, the page you're looking for doesn't exist.", user: req.user, isGuest: req.session.isGuest }); });
app.use((err, req, res, next) => { console.error("Unhandled Error:", err); res.status(err.status || 500).render('error', { pageTitle: 'Server Error', errorCode: err.status || 500, errorMessage: process.env.NODE_ENV === 'production' ? 'Something went wrong on our end.' : err.message, user: req.user, isGuest: req.session.isGuest }); });

app.listen(PORT, () => { console.log(`Servidor iniciado na porta ${PORT}. Ambiente: ${process.env.NODE_ENV}`); });