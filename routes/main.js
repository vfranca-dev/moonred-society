// routes/main.js
const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../config/passport');
const db = require('../config/db');

// Rota genérica para renderizar 'coming soon'
const comingSoonHandler = (pageTitle, sectionTitle) => {
    return (req, res) => {
        res.render('coming-soon', {
            pageTitle: pageTitle,
            sectionTitle: sectionTitle,
            user: req.user
        });
    };
};

// --- ROTA PRINCIPAL (PÁGINA INICIAL COM CARDS) ---
router.get('/', (req, res) => {
    // A variável 'user' é passada automaticamente pelo middleware em server.js
    res.render('index', {
        pageTitle: 'Home - Moonred Society'
        // 'user: req.user' não é mais necessário aqui explicitamente
    });
});

// --- ROTA DE BUSCA ---
router.get('/search', ensureAuthenticated, async (req, res, next) => {
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
        res.render('search-results', { pageTitle: `Search Results for "${query}"`, results: results }); // 'user' passado automaticamente
    } catch (err) {
        console.error("Search Error:", err);
        req.flash('error_msg', 'Error performing search.');
        next(err);
    }
});

// --- ROTAS "COMING SOON" ---
router.get('/updates', comingSoonHandler('Update Log', 'Update Log'));
router.get('/forum', comingSoonHandler('Forum', 'Forum'));
router.get('/gallery', comingSoonHandler('Gallery', 'Gallery'));
router.get('/guild', comingSoonHandler('Moonred Society', 'Moonred Society Guild'));
router.get('/support', comingSoonHandler('Support', 'Support'));

// --- ROTAS QUE REQUEREM LOGIN ---
router.get('/profile', ensureAuthenticated, comingSoonHandler('Your Profile', 'Profile'));
router.get('/games', ensureAuthenticated, (req, res) => { res.render('games', { pageTitle: 'Select Game' }); }); // 'user' passado automaticamente

module.exports = router;