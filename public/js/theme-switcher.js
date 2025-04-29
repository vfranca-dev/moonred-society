// public/js/theme-switcher.js
document.addEventListener('DOMContentLoaded', () => {
    const themeButtons = document.querySelectorAll('#settings-dropdown .theme-button[data-theme]');
    const body = document.body;
    const validThemes = ['nocturnal', 'lyset', 'hollow-wanderer', 'wandering-bokser'];
    const defaultTheme = 'nocturnal';
    const settingsDropdown = document.getElementById('settings-dropdown');
    const settingsButton = document.getElementById('settings-button');

    function applyTheme(themeName) {
        if (!validThemes.includes(themeName)) { themeName = defaultTheme; }
        validThemes.forEach(t => body.classList.remove(`theme-${t}`));
        // Adiciona a classe do tema mesmo se for padrão para garantir aplicação correta
        body.classList.add(`theme-${themeName}`);
        themeButtons.forEach(btn => { btn.classList.toggle('active-theme', btn.dataset.theme === themeName); });
        console.log(`[Theme] Aplicado: ${themeName}`);
    }

    function saveThemePreference(themeName) { try { localStorage.setItem('selectedTheme', themeName); } catch (e) { console.error('[Theme] Erro ao salvar preferência:', e); } }
    function loadAndApplyTheme() { let savedTheme = null; try { savedTheme = localStorage.getItem('selectedTheme'); } catch (e) { console.error('[Theme] Erro ao ler preferência:', e); } const themeToApply = (savedTheme && validThemes.includes(savedTheme)) ? savedTheme : defaultTheme; applyTheme(themeToApply); }

    if (themeButtons.length > 0 && settingsDropdown && settingsButton) {
        themeButtons.forEach(button => {
            button.addEventListener('click', (event) => {
                event.stopPropagation();
                const selectedTheme = button.dataset.theme;
                applyTheme(selectedTheme);
                saveThemePreference(selectedTheme);
                // Fecha o dropdown usando 'visible'
                settingsDropdown.classList.remove('visible');
                settingsButton.setAttribute('aria-expanded', 'false');
            });
        });
    } else { /* Avisos opcionais */ }

    loadAndApplyTheme();
});