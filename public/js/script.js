// public/js/script.js - Script Global
document.addEventListener('DOMContentLoaded', () => {
    console.log("[Global Script] DOM Loaded.");

    const mobileNavToggleButton = document.getElementById('mobile-nav-toggle');
    const body = document.body;
    const mobileOverlay = document.getElementById('mobile-overlay');

    // Toggle da Sidebar (APENAS em mobile view)
    if (mobileNavToggleButton) {
        mobileNavToggleButton.addEventListener('click', () => {
            // Só alterna a visibilidade se estiver em mobile view
            if (body.classList.contains('view-mobile')) {
                body.classList.toggle('sidebar-visible');
                const isVisible = body.classList.contains('sidebar-visible');
                mobileNavToggleButton.setAttribute('aria-expanded', isVisible);
            }
             // Em desktop, o botão não tem efeito visual direto no layout principal via JS
             // (o CSS cuida da sidebar sticky/visível por padrão)
        });
    }

    // Fecha overlay (só aparece em mobile quando sidebar está visível)
    if (mobileOverlay) {
        mobileOverlay.addEventListener('click', () => {
            if (body.classList.contains('view-mobile') && body.classList.contains('sidebar-visible')) {
                body.classList.remove('sidebar-visible');
                if (mobileNavToggleButton) {
                     mobileNavToggleButton.setAttribute('aria-expanded', 'false');
                }
            }
        });
    }

    // Fecha ao clicar em link (só em mobile)
    const sidebarLinks = document.querySelectorAll('.sidebar a');
    sidebarLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (body.classList.contains('view-mobile') && body.classList.contains('sidebar-visible')) {
                 body.classList.remove('sidebar-visible');
                 if (mobileNavToggleButton) {
                     mobileNavToggleButton.setAttribute('aria-expanded', 'false');
                 }
            }
        });
    });

    // Fechar mensagens flash
    const flashMessages = document.querySelectorAll('.messages .alert');
    flashMessages.forEach(message => {
        message.addEventListener('click', () => {
            message.style.opacity = '0';
            setTimeout(() => { message.remove(); }, 500);
        });
    });

}); // Fim DOMContentLoaded