// routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const passport = require('passport');
const crypto = require('crypto');
const db = require('../config/db');
const { sendPasswordResetEmail } = require('../config/mailer');
const ensureNotAuthenticated = (req, res, next) => {
    if (!req.isAuthenticated()) { return next(); }
    res.redirect('/');
};

// --- Login Page ---
router.get('/login', ensureNotAuthenticated, (req, res) => res.render('login', { pageTitle: 'Login' }));

// --- Login Handle ---
router.post('/login', ensureNotAuthenticated, (req, res, next) => {
    console.log('[Auth Route] POST /login initiated.'); // Log Rota
    passport.authenticate('local', {
        successRedirect: '/', // Redireciona para home em sucesso
        failureRedirect: '/auth/login', // Volta para login em falha
        failureFlash: true // Habilita mensagens flash de erro do Passport
    })(req, res, next);
});

// --- Register Page ---
router.get('/register', ensureNotAuthenticated, (req, res) => res.render('register', { pageTitle: 'Register' }));

// --- Register Handle ---
router.post('/register', ensureNotAuthenticated, async (req, res, next) => {
    const { username, email, password, confirmPassword } = req.body;
    let errors = [];
    if (!username || !email || !password || !confirmPassword) { errors.push({ msg: 'Please enter all fields' }); }
    if (password != confirmPassword) { errors.push({ msg: 'Passwords do not match' }); }
    if (password.length < 6) { errors.push({ msg: 'Password must be at least 6 characters' }); }
    if (errors.length > 0) {
        return res.render('register', { errors, username, email, pageTitle: 'Register', user: req.user }); // Passa user
    }
    try {
        const userExists = await db.query('SELECT * FROM users WHERE username = $1 OR email = $2', [username, email]);
        if (userExists.rows.length > 0) {
            errors.push({ msg: 'Username or Email already registered' });
            return res.render('register', { errors, username, email, pageTitle: 'Register', user: req.user }); // Passa user
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.query('INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3)', [username, email, hashedPassword]);
        req.flash('success_msg', 'You are now registered and can log in');
        res.redirect('/auth/login');
    } catch (err) {
        console.error("Register Error:", err);
        errors.push({ msg: 'Something went wrong during registration.' });
        next(err);
    }
});

// --- Forgot Password Page ---
router.get('/forgot-password', ensureNotAuthenticated, (req, res) => {
    res.render('forgot-password', { pageTitle: 'Forgot Password', user: req.user }); // Passa user
});

// --- Forgot Password Handle ---
router.post('/forgot-password', ensureNotAuthenticated, async (req, res, next) => {
    const { email } = req.body;
    if (!email) {
        req.flash('error_msg', 'Please enter your email address.');
        return res.redirect('/auth/forgot-password');
    }
    try {
        const userResult = await db.query('SELECT user_id, email, username FROM users WHERE email = $1', [email]);
        const user = userResult.rows[0];
        if (user) {
            const token = crypto.randomBytes(32).toString('hex');
            const expires = new Date(Date.now() + 3600000);
            await db.query(
                `INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)
                 ON CONFLICT (user_id) DO UPDATE SET token = EXCLUDED.token, expires_at = EXCLUDED.expires_at`,
                [user.user_id, token, expires]
            );
            const emailSent = await sendPasswordResetEmail(user.email, token);
            if (!emailSent) { console.error(`Falha ao enviar email de reset para ${user.email}`); }
        } else { console.log(`[Forgot PW] E-mail não encontrado: ${email}`); }
        req.flash('success_msg', 'If an account with that email exists, a password reset link has been sent.');
        res.redirect('/auth/login');
    } catch (err) {
        console.error("Forgot Password Error:", err);
        req.flash('error_msg', 'An error occurred processing your request.');
        res.redirect('/auth/login');
    }
});

// --- Reset Password Page (GET) ---
router.get('/reset/:token', ensureNotAuthenticated, async (req, res, next) => {
    const { token } = req.params;
    try {
        const tokenResult = await db.query('SELECT * FROM password_reset_tokens WHERE token = $1 AND expires_at > NOW()', [token]);
        if (tokenResult.rows.length === 0) {
            req.flash('error_msg', 'Password reset token is invalid or has expired.');
            return res.redirect('/auth/forgot-password');
        }
        res.render('reset-password', { pageTitle: 'Reset Password', token: token, user: req.user }); // Passa user
    } catch (err) {
        console.error("Reset Token GET Error:", err);
        req.flash('error_msg', 'An error occurred.');
        res.redirect('/auth/forgot-password');
    }
});

// --- Reset Password Handle (POST) ---
router.post('/reset/:token', ensureNotAuthenticated, async (req, res, next) => {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;
    let errors = [];
    if (!password || !confirmPassword) { errors.push({ msg: 'Please enter all fields' }); }
    if (password !== confirmPassword) { errors.push({ msg: 'Passwords do not match' }); }
    if (password.length < 6) { errors.push({ msg: 'Password must be at least 6 characters' }); }
    if (errors.length > 0) {
        return res.render('reset-password', { errors, token, pageTitle: 'Reset Password', user: req.user }); // Passa user
    }
    const client = await db.connect();
    try {
        await client.query('BEGIN');
        const tokenResult = await client.query('SELECT id, user_id FROM password_reset_tokens WHERE token = $1 AND expires_at > NOW() FOR UPDATE', [token]);
        if (tokenResult.rows.length === 0) {
            await client.query('ROLLBACK');
            req.flash('error_msg', 'Password reset token is invalid or has expired.');
            return res.redirect('/auth/forgot-password');
        }
        const { id: tokenId, user_id: userId } = tokenResult.rows[0];
        const hashedPassword = await bcrypt.hash(password, 10);
        await client.query('UPDATE users SET password_hash = $1 WHERE user_id = $2', [hashedPassword, userId]);
        await client.query('DELETE FROM password_reset_tokens WHERE id = $1', [tokenId]);
        await client.query('COMMIT');
        req.flash('success_msg', 'Your password has been successfully reset. Please log in.');
        res.redirect('/auth/login');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Reset Password POST Error:", err);
        req.flash('error_msg', 'An error occurred while resetting your password.');
        res.render('reset-password', { errors: [{msg: 'An error occurred.'}], token, pageTitle: 'Reset Password', user: req.user }); // Passa user
    } finally {
        client.release();
    }
});

// --- Logout Handle ---
router.post('/logout', (req, res, next) => {
    req.logout(function(err) {
        if (err) {
             console.error("Logout error:", err); // Log erro no logout
             return next(err);
        }
        req.flash('success_msg', 'You are logged out');
        res.redirect('/auth/login');
    });
});

module.exports = router;