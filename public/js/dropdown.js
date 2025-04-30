// public/js/dropdown.js
document.addEventListener('DOMContentLoaded', () => {
    const settingsButtonSidebar = document.getElementById('sidebar-settings-button');
    const settingsDropdown = document.getElementById('settings-dropdown');
    const mobileOverlay = document.getElementById('mobile-overlay');
    const body = document.body;

    if (settingsButtonSidebar && settingsDropdown) {
        settingsButtonSidebar.addEventListener('click', (event) => {
            event.stopPropagation();
            settingsDropdown.classList.toggle('visible');
            const isNowVisible = settingsDropdown.classList.contains('visible');
            settingsButtonSidebar.setAttribute('aria-expanded', isNowVisible);
            if (mobileOverlay) {
                // Mostra overlay APENAS se o dropdown estiver visível E for mobile view
                if (isNowVisible && body.classList.contains('view-mobile')) {
                     mobileOverlay.style.display = 'block';
                     mobileOverlay.style.zIndex = '1150'; // Abaixo do dropdown
                } else {
                     mobileOverlay.style.display = 'none';
                }
            }
        });

        const closeDropdown = () => {
            if(settingsDropdown.classList.contains('visible')){
                 settingsDropdown.classList.remove('visible');
                 settingsButtonSidebar.setAttribute('aria-expanded', 'false');
                 if (mobileOverlay) {
                    mobileOverlay.style.display = 'none';
                 }
            }
        }

        document.addEventListener('click', (event) => {
            if (settingsDropdown.classList.contains('visible')) {
                 if ((!settingsDropdown.contains(event.target) && !settingsButtonSidebar.contains(event.target))
                     || (mobileOverlay && event.target === mobileOverlay))
                 {
                    closeDropdown();
                 }
            }
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && settingsDropdown.classList.contains('visible')) {
                closeDropdown();
            }
        });
    }
});