// public/js/theme-switcher.js
document.addEventListener('DOMContentLoaded', () => {
    const themeButtons = document.querySelectorAll('#settings-dropdown .theme-button[data-theme]');
    const body = document.body;
    const validThemes = ['nocturnal', 'lyset', 'hollow-wanderer', 'wandering-bokser'];
    const defaultTheme = 'nocturnal'; // Ou o tema que você quer como padrão
    const settingsDropdown = document.getElementById('settings-dropdown');
    // Referencia o botão da sidebar, que agora controla o dropdown
    const settingsButtonSidebar = document.getElementById('sidebar-settings-button');
    const mobileOverlay = document.getElementById('mobile-overlay');

    function applyTheme(themeName) {
        if (!validThemes.includes(themeName)) {
            console.warn(`[Theme] Invalid theme '${themeName}', using default '${defaultTheme}'.`);
            themeName = defaultTheme;
        }
        // Remove todas as classes de tema existentes
        validThemes.forEach(t => body.classList.remove(`theme-${t}`));
        // Adiciona a classe do tema selecionado (mesmo o padrão para consistência)
        body.classList.add(`theme-${themeName}`);

        // Marca o botão ativo no dropdown
        themeButtons.forEach(btn => {
            btn.classList.toggle('active-theme', btn.dataset.theme === themeName);
        });
        console.log(`[Theme] Applied: ${themeName}`);
    }

    function saveThemePreference(themeName) {
        try {
            localStorage.setItem('selectedTheme', themeName);
            console.log(`[Theme] Preference saved: ${themeName}`);
        } catch (e) {
            console.error('[Theme] Could not save theme preference to localStorage:', e);
        }
    }

    function loadAndApplyTheme() {
        let savedTheme = null;
        try {
            savedTheme = localStorage.getItem('selectedTheme');
        } catch (e) {
            console.error('[Theme] Could not read theme preference from localStorage:', e);
        }
        const themeToApply = (savedTheme && validThemes.includes(savedTheme)) ? savedTheme : defaultTheme;
        applyTheme(themeToApply);
    }

    // Adiciona listeners aos botões de tema
    if (themeButtons.length > 0 && settingsDropdown && settingsButtonSidebar) {
        themeButtons.forEach(button => {
            button.addEventListener('click', (event) => {
                event.stopPropagation();
                const selectedTheme = button.dataset.theme;
                applyTheme(selectedTheme);
                saveThemePreference(selectedTheme);

                // Fecha o dropdown
                settingsDropdown.classList.remove('visible');
                settingsButtonSidebar.setAttribute('aria-expanded', 'false'); // Atualiza o botão da sidebar

                // Esconde o overlay também, se estiver visível
                if (mobileOverlay) {
                    mobileOverlay.style.display = 'none';
                }
            });
        });
    } else {
        // Warnings opcionais
        // if (themeButtons.length === 0) console.warn("[Theme] Theme buttons not found inside #settings-dropdown.");
        // if (!settingsDropdown) console.warn("[Theme] #settings-dropdown not found.");
        // if (!settingsButtonSidebar) console.warn("[Theme] #sidebar-settings-button not found.");
    }

    // Carrega e aplica o tema ao iniciar a página
    loadAndApplyTheme();
});