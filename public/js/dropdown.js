// public/js/dropdown.js
document.addEventListener('DOMContentLoaded', () => {
    const settingsButton = document.getElementById('settings-button');
    const settingsDropdown = document.getElementById('settings-dropdown');

    // Só executa a lógica se AMBOS os elementos existirem
    if (settingsButton && settingsDropdown) {
        console.log("[Dropdown] Settings button and dropdown found. Adding listener.");

        settingsButton.addEventListener('click', (event) => {
            console.log("[Dropdown] Settings BUTTON CLICKED."); // Log: Clique detectado
            event.stopPropagation(); // Impede que o clique no botão feche o menu imediatamente

            const isCurrentlyVisible = settingsDropdown.classList.contains('visible');
            console.log(`[Dropdown] Before toggle - Dropdown visible: ${isCurrentlyVisible}`); // Log: Estado antes

            // Alterna a classe 'visible' no dropdown
            settingsDropdown.classList.toggle('visible');

            const isNowVisible = settingsDropdown.classList.contains('visible');
            console.log(`[Dropdown] After toggle - Dropdown visible: ${isNowVisible}`); // Log: Estado depois

            // Adiciona/remove um atributo aria-expanded para acessibilidade
            settingsButton.setAttribute('aria-expanded', isNowVisible);
            console.log(`[Dropdown] Set aria-expanded to: ${isNowVisible}`); // Log: Aria atualizado
        });

        // Fechar o dropdown se clicar fora dele
        document.addEventListener('click', (event) => {
            // Verifica se o dropdown está visível E se o clique foi fora do dropdown E fora do botão
            if (settingsDropdown.classList.contains('visible') && !settingsDropdown.contains(event.target) && event.target !== settingsButton) {
                console.log("[Dropdown] Click OUTSIDE detected. Closing dropdown."); // Log
                settingsDropdown.classList.remove('visible');
                settingsButton.setAttribute('aria-expanded', 'false');
            }
        });

        // Opcional: Fechar com a tecla Escape
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && settingsDropdown.classList.contains('visible')) {
                console.log("[Dropdown] ESC key pressed. Closing dropdown."); // Log
                settingsDropdown.classList.remove('visible');
                settingsButton.setAttribute('aria-expanded', 'false');
            }
        });

    } else {
        // Avisa apenas se estivermos numa página que deveria ter o botão (logado)
        // Verificamos isso checando se o elemento .user-info existe, por exemplo.
        if (document.querySelector('.user-info')) {
             if (!settingsButton) console.warn('[Dropdown] Botão Settings (ID: settings-button) não encontrado, mas esperado (usuário logado).');
             if (!settingsDropdown) console.warn('[Dropdown] Dropdown Settings (ID: settings-dropdown) não encontrado, mas esperado (usuário logado).');
        }
    }
});