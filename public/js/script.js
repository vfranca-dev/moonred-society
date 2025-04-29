// public/js/script.js - Script Global

document.addEventListener('DOMContentLoaded', () => {
    console.log("[Global Script] DOM Loaded.");

    // REMOVIDO: Lógica duplicada para o dropdown de Settings.
    // REMOVIDO: Lógica duplicada para a troca de View.

    // --- Lógica para Toggle da Sidebar Mobile ---
    const mobileNavToggleButton = document.getElementById('mobile-nav-toggle');
    const body = document.body;
    const mobileOverlay = document.getElementById('mobile-overlay'); // Certifique-se que o overlay existe no HTML se for usá-lo

    if (mobileNavToggleButton) {
        mobileNavToggleButton.addEventListener('click', () => {
            body.classList.toggle('sidebar-visible');
            // Atualiza aria-expanded para acessibilidade
            const isVisible = body.classList.contains('sidebar-visible');
            mobileNavToggleButton.setAttribute('aria-expanded', isVisible);
        });
    }

    // Fecha a sidebar se clicar no overlay (se existir)
    if (mobileOverlay) {
        mobileOverlay.addEventListener('click', () => {
            if (body.classList.contains('sidebar-visible')) {
                body.classList.remove('sidebar-visible');
                if (mobileNavToggleButton) {
                     mobileNavToggleButton.setAttribute('aria-expanded', 'false');
                }
            }
        });
    }

    // Opcional: Fecha a sidebar se clicar num link dentro dela (bom para SPAs ou navegação por hash)
    const sidebarLinks = document.querySelectorAll('.sidebar a'); // Links dentro da sidebar
    sidebarLinks.forEach(link => {
        link.addEventListener('click', () => {
             // Só fecha se estiver em modo mobile E a sidebar estiver visível
            if (body.classList.contains('view-mobile') && body.classList.contains('sidebar-visible')) {
                body.classList.remove('sidebar-visible');
                 if (mobileNavToggleButton) {
                     mobileNavToggleButton.setAttribute('aria-expanded', 'false');
                 }
            }
        });
    });
    // --- Fim da Lógica Mobile ---


    // Exemplo: Fechar mensagens flash (mantido da versão anterior)
    const flashMessages = document.querySelectorAll('.messages .alert');
    flashMessages.forEach(message => {
        message.addEventListener('click', () => {
            message.style.opacity = '0';
            setTimeout(() => { message.remove(); }, 500);
        });
        // setTimeout(() => {
        //     message.style.opacity = '0';
        //     setTimeout(() => { message.remove(); }, 500);
        // }, 7000);
    });

}); // Fim DOMContentLoaded