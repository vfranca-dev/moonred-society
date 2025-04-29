// public/js/eldenring-tracker.js
document.addEventListener('DOMContentLoaded', () => {
    console.log("[EldenRing Tracker] DOM Loaded. Initializing..."); // Log inicial

    const sidebarSelector = '.sidebar .sections a[href^="#"]';
    const sidebarLinks = document.querySelectorAll(sidebarSelector);
    const gameSections = document.querySelectorAll('.game-section');
    const initialMessage = document.getElementById('initial-message');
    const contentArea = document.querySelector('.content');

    if (!sidebarLinks.length) console.error(`[EldenRing Tracker] Sidebar links not found with selector "${sidebarSelector}". Check sidebar-eldenring.ejs HTML.`);
    if (!gameSections.length) console.error(`[EldenRing Tracker] No elements found with class ".game-section". Check eldenring.ejs HTML.`);
    if (!contentArea) console.warn('[EldenRing Tracker] Element .content not found.');

    // Mapeamento explícito dos formulários de edição
    const allEditForms = {
        'Map Areas': document.getElementById('edit-area-form'), // Usando nome descritivo como chave
        'Sites of Grace': document.getElementById('edit-grace-form'),
        'Bosses': document.getElementById('edit-boss-form'),
        'Enemies': document.getElementById('edit-enemy-form'),
        'Merchants': document.getElementById('edit-merchant-form'),
        'Items': document.getElementById('edit-item-form')
    };
    let currentVisibleSection = null;

    function showSection(targetId) {
        console.log(`[showSection] Attempting to show section: ${targetId}`); // Log
        currentVisibleSection = null;
        if (initialMessage) initialMessage.classList.add('hidden');

        let foundTarget = false;
        gameSections.forEach(section => {
            const isTarget = `#${section.id}` === targetId;
            section.classList.toggle('hidden', !isTarget); // Esconde se NÃO for o alvo, mostra se FOR
            if (isTarget) {
                console.log(`[showSection] Showing: #${section.id}`); // Log
                currentVisibleSection = section;
                foundTarget = true;
            } else {
                 // console.log(`[showSection] Hiding: #${section.id}`); // Log (Opcional, pode poluir muito)
            }
        });

        if (!foundTarget) {
             console.warn(`[showSection] Target element ${targetId} not found or is not a .game-section.`);
            if (initialMessage) initialMessage.classList.remove('hidden');
        }

        // Esconde formulários Add/Edit abertos e reseta botões Add
        document.querySelectorAll('.add-item-form:not(.hidden)').forEach(form => form.classList.add('hidden'));
        document.querySelectorAll('.button-add-toggle.active').forEach(btn => { btn.classList.remove('active'); btn.textContent = 'Add New'; });
        Object.values(allEditForms).forEach(form => { if (form && !form.classList.contains('hidden')) { hideEditForm(form, form.closest('.game-section')); } });

        // Reseta estado do accordion (opcional, mas bom para consistência)
        document.querySelectorAll('.item-details-content.visible').forEach(details => details.classList.remove('visible'));
        document.querySelectorAll('.accordion-indicator.open').forEach(ind => ind.classList.remove('open'));
    }

    if (sidebarLinks.length > 0) {
        sidebarLinks.forEach(link => {
            link.addEventListener('click', (event) => {
                const targetSectionId = link.getAttribute('href');
                console.log(`[Sidebar Click] Clicked link for: ${targetSectionId}`); // Log
                if (targetSectionId && targetSectionId.startsWith('#')) {
                    const targetElement = document.getElementById(targetSectionId.substring(1));
                    if (targetElement && targetElement.classList.contains('game-section')) {
                        event.preventDefault();
                        sidebarLinks.forEach(l => l.classList.remove('active-link'));
                        link.classList.add('active-link');
                        showSection(targetSectionId);
                        try { if (history.pushState) { history.pushState(null, null, targetSectionId); } else { window.location.hash = targetSectionId; } } catch (e) {}
                    } else {
                         console.warn(`[Sidebar Click] Target element ${targetSectionId} not found or not a game-section.`);
                    }
                }
            });
        });
    }

    // --- Função handleDeleteClick (sem alterações) ---
    async function handleDeleteClick(event, sectionElement, itemType, deleteUrlPrefix, itemSelector, idAttribute = 'data-id') { if (event.target.classList.contains('button-delete')) { const listItem = event.target.closest(itemSelector); if (!listItem) return; const itemId = listItem.getAttribute(idAttribute); const itemNameElement = listItem.querySelector('.item-header strong'); const itemName = itemNameElement ? itemNameElement.textContent.trim() : `item ID ${itemId}`; if (!itemId) return; if (confirm(`Are you sure you want to delete this ${itemType}: "${itemName}"?`)) { try { const response = await fetch(`${deleteUrlPrefix}/${itemId}`, { method: 'DELETE' }); if (response.ok) { listItem.remove(); alert(`${itemType} "${itemName}" deleted.`); const list = sectionElement.querySelector('.accordion-list'); const noDataMsg = sectionElement.querySelector('.no-data-message'); if (list && noDataMsg && list.children.length === 0) { noDataMsg.classList.remove('hidden'); } } else { let errorMsg = `Error deleting ${itemType}: ${response.statusText}`; try { const errorData = await response.json(); errorMsg = `Error deleting ${itemType}: ${errorData.error || response.statusText}`; } catch (e) {} console.error(`Failed delete ${itemType}:`, response.status, response.statusText); alert(errorMsg); } } catch (error) { console.error(`Error fetch delete ${itemType}:`, error); alert(`An error occurred deleting the ${itemType}.`); } } } }

    // --- Função populateEditForm (versão corrigida da resposta anterior, sem alterações aqui) ---
    function populateEditForm(itemElement, formElement) {
        if (!itemElement || !formElement) { console.error("populateEditForm: Item Element ou Form Element não encontrado."); return; }
        formElement.reset();
        formElement.querySelectorAll('select[multiple]').forEach(select => { Array.from(select.options).forEach(option => option.selected = false); });
        const itemId = itemElement.dataset.id; if (!itemId) { console.error("populateEditForm: data-id não encontrado no itemElement", itemElement); return; }
        const baseAction = formElement.dataset.baseAction || ''; if (!baseAction) { console.error("populateEditForm: data-base-action não encontrado no formElement", formElement); return; }
        formElement.action = `${baseAction}${itemId}?_method=PUT`;
        const fieldMappings = { 'name': ['name', 'area_name', 'grace_name', 'boss_name', 'enemy_name', 'merchant_name', 'item_name'], 'notes': ['notes'], 'is_defeated': ['is_defeated'], 'is_obtained': ['is_obtained'], 'item_type': ['item_type'], 'map_area_id': ['map_area_id'], 'nearest_grace_id': ['nearest_grace_id'], 'dropped_item_ids': ['dropped_item_ids'], 'location_area_ids': ['location_area_ids'], 'inventory_item_ids': ['inventory_item_ids'] };
        for (const dataKey in fieldMappings) { if (itemElement.dataset[dataKey] !== undefined) { const possibleNames = fieldMappings[dataKey]; let inputFound = false; for (const inputName of possibleNames) { const input = formElement.querySelector(`[name="${inputName}"]`); if (input) { inputFound = true; const dataValue = itemElement.dataset[dataKey]; try { if (input.type === 'checkbox') { input.checked = (dataValue === 'true'); } else if (input.multiple && input.tagName === 'SELECT') { let values = []; try { values = JSON.parse(dataValue || '[]'); if (!Array.isArray(values)) values = []; } catch(e) { console.warn(`[populateEditForm] Falha ao parsear JSON para ${dataKey}: '${dataValue}'. Tratando como vazio.`); values = []; } Array.from(input.options).forEach(option => { option.selected = values.some(val => String(val) === option.value || Number(val) === Number(option.value)); }); } else { input.value = dataValue || ''; } } catch (e) { console.error(`[populateEditForm] Erro ao definir valor para ${inputName} a partir de data-${dataKey}:`, e); if (input.type !== 'checkbox' && !input.multiple) { input.value = dataValue || ''; } } break; } } } }
    }

    // --- Funções showEditForm, hideEditForm (sem alterações) ---
    function showEditForm(itemElement, formElement) { if (!itemElement || !formElement) return; populateEditForm(itemElement, formElement); const sectionElement = itemElement.closest('.game-section'); const listContainer = sectionElement.querySelector('.accordion-list'); const addButtonItem = sectionElement.querySelector('.button-add-toggle'); const addItemForm = sectionElement.querySelector('form[id^="add-"]'); const noDataMsg = sectionElement.querySelector('.no-data-message'); if (listContainer) listContainer.classList.add('hidden'); if (noDataMsg && !noDataMsg.classList.contains('hidden')) noDataMsg.classList.add('hidden'); if (addButtonItem) addButtonItem.classList.add('hidden'); if (addItemForm && !addItemForm.classList.contains('hidden')) { addItemForm.classList.add('hidden'); const correspondingAddButton = sectionElement.querySelector(`.button-add-toggle[data-form-id="${addItemForm.id}"]`); if(correspondingAddButton) { correspondingAddButton.classList.remove('active'); correspondingAddButton.textContent = 'Add New'; } } formElement.classList.remove('hidden'); formElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
    function hideEditForm(formElement, sectionElement) { if (!formElement || !sectionElement) return; formElement.classList.add('hidden'); formElement.action = ''; const listContainer = sectionElement.querySelector('.accordion-list'); const addButtonItem = sectionElement.querySelector('.button-add-toggle'); const noDataMsg = sectionElement.querySelector('.no-data-message'); if (listContainer) listContainer.classList.remove('hidden'); if (addButtonItem) addButtonItem.classList.remove('hidden'); if (listContainer && listContainer.children.length === 0 && noDataMsg) { noDataMsg.classList.remove('hidden'); } else if (noDataMsg) { noDataMsg.classList.add('hidden'); } }

    // --- Função setupSectionListeners (Revertendo itemType e lookup do editForm) ---
    const setupSectionListeners = (sectionInfo) => {
        if (!sectionInfo || !sectionInfo.element) {
             console.warn(`[setupSectionListeners] Informação da seção inválida ou elemento não encontrado para:`, sectionInfo);
            return;
        }
        const sectionElement = sectionInfo.element;
        const itemType = sectionInfo.itemType; // Usa o nome descritivo (ex: 'Map Area')

        // Busca o formulário de edição usando a chave descritiva
        const editForm = allEditForms[itemType]; // Busca no mapa 'allEditForms'

        const addToggleButton = sectionElement.querySelector('.button-add-toggle');
        const addFormId = sectionElement.dataset.addFormId; // Pega do data attribute
        const addForm = addFormId ? sectionElement.querySelector(`form#${addFormId}`) : null;

        // console.log(`[setupSectionListeners] Setting up for ${itemType}: AddFormId=${addFormId}, EditFormFound=${!!editForm}`); // Log

        // Lógica do botão Add (sem alterações)
        if (addToggleButton && addForm) {
            addToggleButton.addEventListener('click', () => {
                const isHidden = addForm.classList.toggle('hidden');
                addToggleButton.classList.toggle('active');
                addToggleButton.textContent = isHidden ? 'Add New' : 'Cancel Add';
                if (!isHidden) {
                    addForm.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    if (editForm && !editForm.classList.contains('hidden')) {
                        hideEditForm(editForm, sectionElement);
                    }
                }
            });
            const cancelAddBtn = addForm.querySelector('.button-cancel-add');
            if (cancelAddBtn) {
                cancelAddBtn.addEventListener('click', () => {
                    addForm.classList.add('hidden');
                    addToggleButton.classList.remove('active');
                    addToggleButton.textContent = 'Add New';
                    addForm.reset();
                });
            }
        } else {
            // if (!addToggleButton) console.warn(`[setupSectionListeners] Botão Add/Toggle não encontrado para ${itemType}`);
            // if (!addForm) console.warn(`[setupSectionListeners] Formulário Add (ID: ${addFormId}) não encontrado para ${itemType}`);
        }

        // Lógica dos botões Edit/Delete (sem alterações na lógica interna)
        if(sectionInfo.itemSelector){
             sectionElement.addEventListener('click', (event) => {
                const editButton = event.target.closest('.button-edit');
                const deleteButton = event.target.closest('.button-delete');
                const itemElement = event.target.closest(sectionInfo.itemSelector);

                if (editButton && itemElement) { // Verifica se editForm existe antes de chamar showEditForm
                    event.stopPropagation();
                    if (editForm) {
                        showEditForm(itemElement, editForm);
                    } else {
                        console.error(`[Edit Click] Formulário de edição não encontrado para ${itemType}. Verifique o ID no HTML e no objeto allEditForms.`);
                        alert(`Could not find the edit form for ${itemType}.`);
                    }
                } else if (deleteButton && itemElement) {
                    event.stopPropagation();
                    handleDeleteClick(event, sectionElement, itemType, sectionInfo.urlPrefix, sectionInfo.itemSelector, sectionInfo.idAttribute);
                }
            });
        }

        // Lógica do botão Cancel Edit (sem alterações)
        if (editForm) {
            const cancelEditBtn = editForm.querySelector('.button-cancel-edit');
            if (cancelEditBtn) {
                cancelEditBtn.addEventListener('click', () => {
                    hideEditForm(editForm, sectionElement);
                });
            }
        }
         // else { // Opcional: avisar se o formulário de edição não foi encontrado durante setup
         //    console.warn(`[setupSectionListeners] Formulário de Edição não mapeado ou não encontrado no HTML para ${itemType}. A funcionalidade de edição não funcionará.`);
         // }
    };
    // --- Fim da Função setupSectionListeners ---

    // --- Chamadas para setupSectionListeners (Usando nomes descritivos em itemType) ---
    console.log("[EldenRing Tracker] Setting up section listeners...");
    setupSectionListeners({ element: document.getElementById('map-areas-section'), itemType: 'Map Areas', urlPrefix: '/game/elden-ring/map-areas', itemSelector: '.accordion-item', idAttribute: 'data-id' });
    setupSectionListeners({ element: document.getElementById('graces-section'), itemType: 'Sites of Grace', urlPrefix: '/game/elden-ring/graces', itemSelector: '.accordion-item', idAttribute: 'data-id' });
    setupSectionListeners({ element: document.getElementById('bosses-section'), itemType: 'Bosses', urlPrefix: '/game/elden-ring/bosses', itemSelector: '.accordion-item', idAttribute: 'data-id' });
    setupSectionListeners({ element: document.getElementById('enemies-section'), itemType: 'Enemies', urlPrefix: '/game/elden-ring/enemies', itemSelector: '.accordion-item', idAttribute: 'data-id' });
    setupSectionListeners({ element: document.getElementById('merchants-section'), itemType: 'Merchants', urlPrefix: '/game/elden-ring/merchants', itemSelector: '.accordion-item', idAttribute: 'data-id' });
    setupSectionListeners({ element: document.getElementById('items-section'), itemType: 'Items', urlPrefix: '/game/elden-ring/items', itemSelector: '.accordion-item', idAttribute: 'data-id' });
    console.log("[EldenRing Tracker] Section listeners setup complete.");


    // --- Lógica do Accordion (sem alterações) ---
    if (contentArea) {
        contentArea.addEventListener('click', (event) => {
            const itemHeader = event.target.closest('.item-header');
            const clickedInsideActions = event.target.closest('.item-actions'); // Não abre/fecha se clicar nos botões Edit/Delete
            const clickedInsideSubAccordion = event.target.closest('.sub-accordion'); // Não abre/fecha o item principal se clicar num sub-item (overview)

            // Adicionado cheque por sub-accordion
            if (itemHeader && !clickedInsideActions && !clickedInsideSubAccordion) {
                const detailsContent = itemHeader.nextElementSibling;
                const indicator = itemHeader.querySelector('.accordion-indicator');
                // Verifica se o próximo elemento é o conteúdo esperado
                if (detailsContent && detailsContent.classList.contains('item-details-content')) {
                     detailsContent.classList.toggle('visible');
                     if (indicator) { indicator.classList.toggle('open'); }
                }
            } else if (itemHeader && clickedInsideSubAccordion) { // Lógica para sub-accordions (overview)
                 const detailsContent = itemHeader.nextElementSibling;
                 const indicator = itemHeader.querySelector('.accordion-indicator');
                 if (detailsContent && detailsContent.classList.contains('item-details-content')) {
                     detailsContent.classList.toggle('visible');
                     if (indicator) { indicator.classList.toggle('open'); }
                 }
            }
        });
    }

    // --- Função displayInitialSection (sem alterações lógicas, apenas com logs) ---
    function displayInitialSection() {
        console.log("[displayInitialSection] Determining initial section...");
        const hash = window.location.hash;
        let targetId = null;
        let foundTarget = false;

        if (hash && hash !== '#') {
            const el = document.getElementById(hash.substring(1));
            if (el && el.classList.contains('game-section')) {
                targetId = hash;
                foundTarget = true;
                console.log(`[displayInitialSection] Found target section from hash: ${targetId}`);
            } else {
                 console.log(`[displayInitialSection] Hash ${hash} found, but element not found or not a game section.`);
            }
        }

        // Se não encontrou pelo hash, tenta 'overview-section' como padrão
        if (!foundTarget && document.getElementById('overview-section')) {
            targetId = '#overview-section';
            foundTarget = true;
             console.log(`[displayInitialSection] Using default target: ${targetId}`);
        }

         // Fallback para a primeira seção real se overview não existir ou hash falhar
        // if (!foundTarget) {
        //     const firstRealSection = document.querySelector('.game-section:not(#overview-section)');
        //     if (firstRealSection) {
        //         targetId = `#${firstRealSection.id}`;
        //         foundTarget = true;
        //         console.log(`[displayInitialSection] Using first available section as fallback: ${targetId}`);
        //     } else if (document.getElementById('overview-section')) { // Redundante, mas seguro
        //          targetId = '#overview-section';
        //          foundTarget = true;
        //          console.log(`[displayInitialSection] Using overview as final fallback: ${targetId}`);
        //     }
        // }


        if (foundTarget && document.querySelector(targetId)) {
             console.log(`[displayInitialSection] Calling showSection for: ${targetId}`);
            showSection(targetId);
            sidebarLinks.forEach(l => l.classList.remove('active-link'));
            // O seletor do link ativo precisa corresponder ao href exato
            const activeLink = document.querySelector(`.sidebar .sections a[href="${targetId}"]`);
            if (activeLink) {
                activeLink.classList.add('active-link');
                console.log(`[displayInitialSection] Activated sidebar link for: ${targetId}`);
            } else {
                 console.warn(`[displayInitialSection] Could not find sidebar link for: ${targetId}`);
            }
            if(initialMessage) initialMessage.classList.add('hidden');
        } else {
             console.warn("[displayInitialSection] No target section could be determined or found. Showing initial message.");
            if(initialMessage) initialMessage.classList.remove('hidden');
            sidebarLinks.forEach(l => l.classList.remove('active-link'));
             gameSections.forEach(sec => sec.classList.add('hidden')); // Garante que tudo está escondido
        }
         console.log("[displayInitialSection] Initial section display attempt complete.");
    }

    // Chama a função para exibir a seção inicial
    displayInitialSection();

    console.log("[EldenRing Tracker] Initialization complete.");
}); // Fim DOMContentLoaded