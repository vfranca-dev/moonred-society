// routes/main.js
const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../config/passport');
const db = require('../config/db'); // Importa a configuração do DB

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
    res.render('index', {
        pageTitle: 'Home - Moonred Society',
        user: req.user
    });
});

// --- ROTA DE BUSCA (NOVO) ---
router.get('/search', ensureAuthenticated, async (req, res, next) => {
    const query = req.query.q; // Pega o termo de busca da URL (?q=...)
    const userId = req.user.user_id;
    const minQueryLength = 3; // Define um tamanho mínimo para a busca

    if (!query || query.trim().length < minQueryLength) {
        // Se a query for vazia ou muito curta, redireciona de volta ou mostra mensagem
        req.flash('error_msg', `Search term must be at least ${minQueryLength} characters long.`);
        // Tenta voltar para a página anterior, ou para a home como fallback
        const backURL = req.header('Referer') || '/';
        return res.redirect(backURL);
    }

    try {
        const searchTerm = `%${query}%`; // Prepara o termo para ILIKE

        // Busca em paralelo nas tabelas relevantes do Elden Ring
        const [areasResult, gracesResult, bossesResult, enemiesResult, merchantsResult, itemsResult] = await Promise.all([
            db.query('SELECT area_id, area_name FROM elden_ring_map_areas WHERE user_id = $1 AND area_name ILIKE $2 ORDER BY area_name', [userId, searchTerm]),
            db.query('SELECT grace_id, grace_name FROM elden_ring_graces WHERE user_id = $1 AND grace_name ILIKE $2 ORDER BY grace_name', [userId, searchTerm]),
            db.query('SELECT boss_id, boss_name FROM elden_ring_bosses WHERE user_id = $1 AND boss_name ILIKE $2 ORDER BY boss_name', [userId, searchTerm]),
            db.query('SELECT enemy_id, enemy_name FROM elden_ring_enemies WHERE user_id = $1 AND enemy_name ILIKE $2 ORDER BY enemy_name', [userId, searchTerm]),
            db.query('SELECT merchant_id, merchant_name FROM elden_ring_merchants WHERE user_id = $1 AND merchant_name ILIKE $2 ORDER BY merchant_name', [userId, searchTerm]),
            db.query('SELECT item_id, item_name FROM elden_ring_items WHERE user_id = $1 AND item_name ILIKE $2 ORDER BY item_name', [userId, searchTerm])
        ]);

        // Agrupa os resultados
        const results = {
            query: query,
            mapAreas: areasResult.rows,
            graces: gracesResult.rows,
            bosses: bossesResult.rows,
            enemies: enemiesResult.rows,
            merchants: merchantsResult.rows,
            items: itemsResult.rows,
        };

        // Renderiza a página de resultados
        res.render('search-results', {
            pageTitle: `Search Results for "${query}"`,
            user: req.user,
            results: results
        });

    } catch (err) {
        console.error("Search Error:", err);
        req.flash('error_msg', 'Error performing search.');
        next(err); // Passa o erro para o handler de erros
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
router.get('/games', ensureAuthenticated, (req, res) => {
     res.render('games', { // Renderiza views/games.ejs - Certifique-se que existe ou mude para 'index'
        pageTitle: 'Select Game',
        user: req.user
     });
});

module.exports = router;