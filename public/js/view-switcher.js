// public/js/view-switcher.js
document.addEventListener('DOMContentLoaded', () => {
    const viewButtons = document.querySelectorAll('#settings-dropdown .view-button[data-view]');
    const body = document.body;
    const validViews = ['desktop', 'mobile'];
    const defaultView = 'desktop';
    const settingsDropdown = document.getElementById('settings-dropdown');
    const settingsButton = document.getElementById('settings-button');

    function applyView(viewName) {
        if (!validViews.includes(viewName)) { viewName = defaultView; }
        validViews.forEach(v => body.classList.remove(`view-${v}`));
        body.classList.add(`view-${viewName}`);
        viewButtons.forEach(btn => { btn.classList.toggle('active-view', btn.dataset.view === viewName); });
        console.log(`[View] Aplicado: ${viewName}`);
    }

    function saveViewPreference(viewName) { try { localStorage.setItem('selectedView', viewName); } catch (e) { console.error('[View] Erro ao salvar preferência:', e); } }
    function loadAndApplyView() { let savedView = null; try { savedView = localStorage.getItem('selectedView'); } catch (e) { console.error('[View] Erro ao ler preferência:', e); } const viewToApply = (savedView && validViews.includes(savedView)) ? savedView : defaultView; applyView(viewToApply); }

    if (viewButtons.length > 0 && settingsDropdown && settingsButton) {
        viewButtons.forEach(button => {
            button.addEventListener('click', (event) => {
                event.stopPropagation();
                const selectedView = button.dataset.view;
                applyView(selectedView);
                saveViewPreference(selectedView);
                // Fecha o dropdown usando 'visible'
                settingsDropdown.classList.remove('visible');
                settingsButton.setAttribute('aria-expanded', 'false');
            });
        });
     } else { /* Avisos opcionais */ }

    loadAndApplyView();
});