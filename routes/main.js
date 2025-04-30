// routes/main.js
const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../config/passport'); // Usado para garantir login completo
const db = require('../config/db');

// Middleware para garantir login COMPLETO (não convidado)
// Renomeado de ensureAuthenticated para clareza, mas pode manter o nome antigo
const ensureLoggedIn = (req, res, next) => {
    // Verifica se está autenticado E se NÃO é um convidado
    if (req.isAuthenticated() && !req.session.isGuest) {
        return next();
    }
    // Se não for logado completo, redireciona para login
    req.flash('error_msg', 'Please log in to access this feature.');
    res.redirect('/auth/login');
};

// Middleware para permitir acesso a logados ou convidados (para páginas informativas)
const ensureAuthenticatedOrGuest = (req, res, next) => {
    if (req.isAuthenticated() || req.session.isGuest) {
        return next();
    }
    // Se nem logado nem convidado, vai para welcome page (ou login)
    req.flash('error_msg', 'Please log in or continue as guest.');
    res.redirect('/'); // Redireciona para a welcome page
};


// Rota genérica para renderizar 'coming soon'
// Permite acesso a logados e convidados
const comingSoonHandler = (pageTitle, sectionTitle) => {
    return (req, res) => {
        res.render('coming-soon', {
            pageTitle: pageTitle,
            sectionTitle: sectionTitle
            // user e isGuest passados automaticamente via res.locals
        });
    };
};

// ROTA REMOVIDA: router.get('/') - Agora está em server.js para direcionar para welcome ou index

// ROTA DE BUSCA (Requer login completo)
router.get('/search', ensureLoggedIn, async (req, res, next) => {
    const query = req.query.q;
    const userId = req.user.user_id;
    const minQueryLength = 3;

    if (!query || query.trim().length < minQueryLength) {
        req.flash('error_msg', `Search term must be at least ${minQueryLength} characters long.`);
        const backURL = req.header('Referer') || '/';
        return res.redirect(backURL);
    }
    try {
        const searchTerm = `%${query}%`;
        const [areasResult, gracesResult, bossesResult, enemiesResult, merchantsResult, itemsResult] = await Promise.all([
            db.query('SELECT area_id, area_name FROM elden_ring_map_areas WHERE user_id = $1 AND area_name ILIKE $2 ORDER BY area_name', [userId, searchTerm]),
            db.query('SELECT grace_id, grace_name FROM elden_ring_graces WHERE user_id = $1 AND grace_name ILIKE $2 ORDER BY grace_name', [userId, searchTerm]),
            db.query('SELECT boss_id, boss_name FROM elden_ring_bosses WHERE user_id = $1 AND boss_name ILIKE $2 ORDER BY boss_name', [userId, searchTerm]),
            db.query('SELECT enemy_id, enemy_name FROM elden_ring_enemies WHERE user_id = $1 AND enemy_name ILIKE $2 ORDER BY enemy_name', [userId, searchTerm]),
            db.query('SELECT merchant_id, merchant_name FROM elden_ring_merchants WHERE user_id = $1 AND merchant_name ILIKE $2 ORDER BY merchant_name', [userId, searchTerm]),
            db.query('SELECT item_id, item_name FROM elden_ring_items WHERE user_id = $1 AND item_name ILIKE $2 ORDER BY item_name', [userId, searchTerm])
        ]);
        const results = { query: query, mapAreas: areasResult.rows, graces: gracesResult.rows, bosses: bossesResult.rows, enemies: enemiesResult.rows, merchants: merchantsResult.rows, items: itemsResult.rows, };
        res.render('search-results', { pageTitle: `Search Results for "${query}"`, results: results }); // user/isGuest passados automaticamente
    } catch (err) {
        console.error("Search Error:", err);
        req.flash('error_msg', 'Error performing search.');
        next(err);
    }
});

// ROTAS "COMING SOON" (Acessíveis por convidados ou logados)
router.get('/updates', ensureAuthenticatedOrGuest, comingSoonHandler('Update Log', 'Update Log'));
router.get('/forum', ensureAuthenticatedOrGuest, comingSoonHandler('Forum', 'Forum'));
router.get('/gallery', ensureAuthenticatedOrGuest, comingSoonHandler('Gallery', 'Gallery'));
router.get('/guild', ensureAuthenticatedOrGuest, comingSoonHandler('Moonred Society', 'Moonred Society Guild'));
router.get('/support', ensureAuthenticatedOrGuest, comingSoonHandler('Support', 'Support'));

// ROTA PROFILE (Requer login completo)
router.get('/profile', ensureLoggedIn, comingSoonHandler('Your Profile', 'Profile'));

// ROTA /games (Redireciona para a home)
router.get('/games', (req, res) => {
    res.redirect('/');
});

module.exports = router;