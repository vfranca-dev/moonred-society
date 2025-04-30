// public/js/view-switcher.js
document.addEventListener('DOMContentLoaded', () => {
    const viewButtons = document.querySelectorAll('#settings-dropdown .view-button[data-view]');
    const body = document.body;
    const validViews = ['desktop', 'mobile'];
    const defaultView = 'mobile';
    const settingsDropdown = document.getElementById('settings-dropdown');
    const settingsButtons = document.querySelectorAll('#sidebar-settings-button');
    const mobileNavToggleButton = document.getElementById('mobile-nav-toggle');
    const mobileOverlay = document.getElementById('mobile-overlay'); // Pega o overlay

    function applyView(viewName) {
        if (!validViews.includes(viewName)) { viewName = defaultView; }
        console.log(`[View] Applying view class: ${viewName}`);
        validViews.forEach(v => body.classList.remove(`view-${v}`));
        body.classList.add(`view-${viewName}`);

        // Define estado padrão da sidebar baseado na view
        if (viewName === 'desktop') {
            body.classList.add('sidebar-visible');
            if (mobileNavToggleButton) mobileNavToggleButton.setAttribute('aria-expanded', 'true');
            // Garante que o overlay esteja escondido no desktop
            if (mobileOverlay) mobileOverlay.style.display = 'none';
        } else { // Mobile View
            body.classList.remove('sidebar-visible');
            if (mobileNavToggleButton) mobileNavToggleButton.setAttribute('aria-expanded', 'false');
            // Não mexe no display do overlay aqui, ele é controlado pelo toggle da sidebar/dropdown em mobile
        }

        viewButtons.forEach(btn => { btn.classList.toggle('active-view', btn.dataset.view === viewName); });
    }

    function saveViewPreference(viewName) { try { localStorage.setItem('selectedView', viewName); } catch (e) { console.error('[View] Erro ao salvar preferência:', e); } }
    function loadInitialView() { let savedView = null; try { savedView = localStorage.getItem('selectedView'); } catch (e) { console.error('[View] Erro ao ler preferência:', e); } const viewToApply = (savedView && validViews.includes(savedView)) ? savedView : defaultView; applyView(viewToApply); }

    if (viewButtons.length > 0 && settingsDropdown && settingsButtons.length > 0) {
        viewButtons.forEach(button => {
            button.addEventListener('click', (event) => {
                event.stopPropagation();
                const selectedView = button.dataset.view;
                applyView(selectedView);
                saveViewPreference(selectedView);
                settingsDropdown.classList.remove('visible');
                settingsButtons.forEach(btn => btn.setAttribute('aria-expanded', 'false'));
                // Garante que overlay esconda ao fechar dropdown via seleção de view
                if (mobileOverlay) mobileOverlay.style.display = 'none';
            });
        });
     }

    loadInitialView();
});