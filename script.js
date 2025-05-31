document.addEventListener('DOMContentLoaded', () => {
    const messageList = document.getElementById('messageList');
    const messageInput = document.getElementById('messageInput');
    const sendMessageBtn = document.getElementById('sendMessageBtn');
    // const configPanelBtn = document.getElementById('configPanelBtn'); // Old button, no longer in HTML
    // const configPanel = document.getElementById('configPanel'); // Old overlay panel, no longer in HTML

    // New Element Selectors for Sidebar and Config Area
    const settingsBtn = document.getElementById('settingsBtn');
    const sidebarConfigArea = document.getElementById('sidebarConfigArea');
    const engineOptionsContainer = document.querySelector('.sidebar-config-area .engine-options');
    const modelSelectionSection = document.getElementById('modelSelectionSection');
    const modelSectionContext = document.getElementById('modelSectionContext');

    const modelListContainer = document.getElementById('modelList'); // Should be within sidebarConfigArea
    const providerSelectionSection = document.getElementById('providerSelectionSection');  // Should be within sidebarConfigArea
    const selectedModelNameProviderTitle = document.getElementById('selectedModelNameProviderTitle'); // Should be within sidebarConfigArea
    const applyConfigBtn = document.getElementById('applyConfigBtn'); // Should be within sidebarConfigArea
    const activeConfigDisplay = document.getElementById('activeConfigDisplay'); // In main chat header
    const modelSearchInput = document.getElementById('modelSearchInput'); // Should be within sidebarConfigArea
    const providerListContainer = document.getElementById('providerList'); // Should be within sidebarConfigArea

    // Note: closeConfigPanelBtnInside is not in the new HTML structure for sidebarConfigArea's header.
    // If it were, it would be: const closeConfigPanelBtnInside = document.getElementById('closeConfigPanelBtnInside');

    const backendBaseUrl = 'http://127.0.0.1:8000/api/v1';

    let selectedModel = null;
    let selectedProvider = null;
    let selectedEngine = null; // New variable for selected engine

    // --- Sidebar Functionality ---
    const leftSidebar = document.getElementById('leftSidebar');
    const sidebarToggleBtn = document.getElementById('sidebarToggleBtn');
    const sidebarTitle = document.getElementById('sidebarTitle');
    const appLayout = document.querySelector('.app-layout');

    const EXPANDED_SIDEBAR_TITLE = "Menu";
    const COLLAPSED_SIDEBAR_TITLE = "";

    function setSidebarState(isCollapsed) {
        if (!leftSidebar || !appLayout) return;
        if (isCollapsed) {
            leftSidebar.classList.add('collapsed');
            appLayout.classList.add('sidebar-collapsed');
            if (sidebarTitle) sidebarTitle.textContent = COLLAPSED_SIDEBAR_TITLE;
            if (sidebarToggleBtn) sidebarToggleBtn.innerHTML = '&#9776;'; // Hamburger when collapsed
            localStorage.setItem('sidebarCollapsed', 'true');
        } else {
            leftSidebar.classList.remove('collapsed');
            appLayout.classList.remove('sidebar-collapsed');
            if (sidebarTitle) sidebarTitle.textContent = EXPANDED_SIDEBAR_TITLE;
            if (sidebarToggleBtn) sidebarToggleBtn.innerHTML = '&lt;';
            localStorage.setItem('sidebarCollapsed', 'false');
        }
    }

    if (sidebarToggleBtn && leftSidebar) {
        sidebarToggleBtn.addEventListener('click', () => {
            const isCollapsed = leftSidebar.classList.contains('collapsed');
            setSidebarState(!isCollapsed);
            // If opening the sidebar and config area was visible, it might need layout adjustment
            // For now, this is handled by flexbox and transitions.
        });
    }
    const initialSidebarState = localStorage.getItem('sidebarCollapsed') === 'true';
    if (typeof setSidebarState === "function") {
       setSidebarState(initialSidebarState);
    }
    // --- End Sidebar Functionality ---

    const MOCK_PROVIDER_DATA = { // Preserved from previous versions
        "llama2-7b-chat": [
            {"providerId": "replicate", "providerName": "Replicate", "providerIconUrl": "icons/replicate-logo.png", "notes": "Fast cold starts.", "tiers": [{"tierId": "replicate-t4", "tierName": "Standard (NVIDIA T4)", "tierIconClass": "fas fa-gpu", "specs": "NVIDIA T4 GPU", "pricePrediction": "Est. $0.0015 / 1k tokens", "priceDetails": { "per1kTokens": 0.0015, "unit": "1k tokens"}}]},
            {"providerId": "supercompute", "providerName": "SuperCompute", "providerIconUrl": "icons/supercompute-logo.png", "notes": "Good for large jobs.", "tiers": [{"tierId": "sc-a100", "tierName": "Large (NVIDIA A100)", "tierIconClass": "fas fa-server", "specs": "NVIDIA A100 GPU", "pricePrediction": "Est. $1.20 / hour", "priceDetails": { "perHour": 1.20, "unit": "hour"}}]}
        ],
        "meta-llama/Llama-2-7b-chat-hf": [ // Example with full ID
            {"providerId": "replicate", "providerName": "Replicate", "providerIconUrl": "icons/replicate-logo.png", "notes": "Fast cold starts.", "tiers": [{"tierId": "replicate-t4", "tierName": "Standard (NVIDIA T4)", "tierIconClass": "fas fa-gpu", "specs": "NVIDIA T4 GPU", "pricePrediction": "Est. $0.0015 / 1k tokens", "priceDetails": { "per1kTokens": 0.0015, "unit": "1k tokens"}}]},
        ],
        "mistral-7b-instruct": [
            {"providerId": "replicate", "providerName": "Replicate", "providerIconUrl": "icons/replicate-logo.png", "notes": "Optimized for Mistral.", "tiers": [{"tierId": "replicate-mistral-t4", "tierName": "Standard (NVIDIA T4)", "tierIconClass": "fas fa-gpu", "specs": "NVIDIA T4 GPU", "pricePrediction": "Est. $0.0007 / 1k tokens", "priceDetails": { "per1kTokens": 0.0007, "unit": "1k tokens"}}]}
        ],
         "mistralai/Mistral-7B-Instruct-v0.1": [
           {"providerId": "replicate", "providerName": "Replicate", "providerIconUrl": "icons/replicate-logo.png", "notes": "Optimized for Mistral.", "tiers": [{"tierId": "replicate-mistral-t4", "tierName": "Standard (NVIDIA T4)", "tierIconClass": "fas fa-gpu", "specs": "NVIDIA T4 GPU", "pricePrediction": "Est. $0.0007 / 1k tokens", "priceDetails": { "per1kTokens": 0.0007, "unit": "1k tokens"}}]}
        ],
        "codellama-13b": [],
        "codellama/CodeLlama-13b-hf": []
    };

    async function fetchModelsFromBackend( { searchTerm = '', limit = 10, page = 1, sortBy = 'downloads', direction = 'desc' } = {} ) {
        console.log(`Fetching models: search='${searchTerm}', limit=${limit}, page=${page}, sort=${sortBy}, dir=${direction}`);
        if (modelListContainer) modelListContainer.innerHTML = '<p class="loading-message">Loading models...</p>';
        const params = new URLSearchParams();
        if (searchTerm) params.append('search', searchTerm);
        params.append('limit', limit); params.append('page', page); params.append('sort', sortBy); params.append('direction', direction);
        try {
            const response = await fetch(`${backendBaseUrl}/hf-models/?${params.toString()}`); // Updated endpoint
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ detail: "Unknown error fetching models" }));
                console.error('Error fetching models:', response.status, errorData);
                if (modelListContainer) modelListContainer.innerHTML = `<p class="error-message">Error: ${errorData.detail || response.statusText}</p>`;
                return [];
            }
            const responseData = await response.json();
            console.log('Models fetched:', responseData);
            if (responseData.items && responseData.items.length === 0 && searchTerm) {
                if (modelListContainer) modelListContainer.innerHTML = `<p class="no-results-message">No models found for "${searchTerm}".</p>`;
            } else if (!responseData.items || responseData.items.length === 0) {
                 if (modelListContainer) modelListContainer.innerHTML = `<p class="no-results-message">No models available.</p>`;
            }
            return responseData.items || [];
        } catch (error) {
            console.error('Network or other error fetching models:', error);
            if (modelListContainer) modelListContainer.innerHTML = '<p class="error-message">Network error. Ensure backend is running & CORS configured.</p>';
            return [];
        }
    }

    async function fetchProvidersForModelFromBackend(modelId) {
        console.log(`Fetching providers for model (simulated): ${modelId}...`);
        if (providerListContainer) providerListContainer.innerHTML = '<p class="loading-message">Loading providers...</p>';
        await new Promise(resolve => setTimeout(resolve, 300));
        try {
            const providers = MOCK_PROVIDER_DATA[modelId] || MOCK_PROVIDER_DATA[modelId.split('/').pop()] || [];
             if (providers.length === 0 && modelId) console.warn(`No mock providers found for modelId: ${modelId}`);
            return providers;
        } catch (error) {
            console.error(`Error fetching/simulating providers for model ${modelId}:`, error);
            if (providerListContainer) providerListContainer.innerHTML = `<p class="error-message">Error loading providers.</p>`;
            return [];
        }
    }

    // Modified resetConfigPanelState function
    function resetConfigPanelState() {
        selectedModel = null;
        selectedProvider = null;
        selectedEngine = null;

        if (engineOptionsContainer) {
            engineOptionsContainer.querySelectorAll('.engine-option').forEach(div => div.classList.remove('selected'));
            engineOptionsContainer.querySelectorAll('input[type="radio"]').forEach(rb => rb.checked = false);
        }
        if (modelSelectionSection) modelSelectionSection.style.display = 'none';
        if (modelSectionContext) modelSectionContext.textContent = '';
        if (providerListContainer) providerListContainer.innerHTML = '';
        if (providerSelectionSection) providerSelectionSection.style.display = 'none';
        if (selectedModelNameProviderTitle) selectedModelNameProviderTitle.textContent = '';
        if (modelSearchInput) {
            modelSearchInput.value = '';
            modelSearchInput.placeholder = "Search models..."; // Reset placeholder
        }
        if (modelListContainer) modelListContainer.innerHTML = '';
        console.log('Config panel state FULLY reset.');
    }

    function addMessage(text, sender) { /* ... (implementation as before) ... */ }
    function handleSendMessage() { /* ... (implementation as before) ... */ }
    function simulateAIResponse(userText) { /* ... (implementation as before) ... */ }
    function renderModelCards(modelsToRender) { /* ... (implementation as before) ... */ }
    function initializeModelSelection() { /* ... (implementation as before, uses new fetchProvidersForModelFromBackend) ... */ }
    function renderProviderCards(providersData) { /* ... (implementation as before) ... */ }

    // Re-add implementations for brevity in this diff, assuming they are the same as phase 13
    function addMessage(text, sender) {
        if (!messageList) return;
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', sender === 'user' ? 'user-message' : 'ai-message');
        const paragraph = document.createElement('p');
        paragraph.textContent = text;
        messageDiv.appendChild(paragraph);
        const timestampSpan = document.createElement('span');
        timestampSpan.classList.add('timestamp');
        timestampSpan.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        messageDiv.appendChild(timestampSpan);
        messageList.appendChild(messageDiv);
        messageList.scrollTop = messageList.scrollHeight;
    }
    function handleSendMessage() {
        if (!messageInput) return;
        const text = messageInput.value.trim();
        if (text) { addMessage(text, 'user'); messageInput.value = ''; setTimeout(() => simulateAIResponse(text), 1000); }
    }
    function simulateAIResponse(userText) { addMessage(`Mock AI received: '${userText}'`, 'ai'); }

    function renderModelCards(modelsToRender) {
        if (!modelListContainer) return;
        modelListContainer.innerHTML = '';
        if (!modelsToRender || modelsToRender.length === 0) {
            // Displayed by fetchModelsFromBackend if search term was present
            // If no search term, and still empty, it means no models at all.
            if(!modelSearchInput || !modelSearchInput.value) {
                 modelListContainer.innerHTML = '<p class="no-results-message">No models available to display.</p>';
            }
            return;
        }
        modelsToRender.forEach(model => {
            const card = document.createElement('div'); card.classList.add('model-card'); card.dataset.modelId = model.id;
            const iconImg = document.createElement('img'); iconImg.src = model.iconUrl || 'icons/default-model-icon.png'; iconImg.alt = `${model.name} Icon`; iconImg.classList.add('model-icon'); iconImg.onerror = () => { iconImg.src = 'icons/default-model-icon.png'; };
            const infoDiv = document.createElement('div'); infoDiv.classList.add('model-card-info');
            const nameH4 = document.createElement('h4'); nameH4.textContent = model.name || model.id; infoDiv.appendChild(nameH4); // Fallback to ID for name
            const creatorP = document.createElement('p'); creatorP.classList.add('model-creator'); creatorP.textContent = model.creator || 'Unknown'; infoDiv.appendChild(creatorP);
            const descriptionP = document.createElement('p'); descriptionP.classList.add('model-description'); descriptionP.textContent = model.description || 'No description.'; infoDiv.appendChild(descriptionP);
            if (model.tags && model.tags.length > 0) {
                const tagsDiv = document.createElement('div'); tagsDiv.classList.add('model-tags');
                model.tags.forEach(tagText => { const tagSpan = document.createElement('span'); tagSpan.classList.add('tag'); tagSpan.textContent = tagText; tagsDiv.appendChild(tagSpan); });
                infoDiv.appendChild(tagsDiv);
            }
            const selectBtn = document.createElement('button'); selectBtn.classList.add('select-model-btn'); selectBtn.textContent = 'Select';
            card.appendChild(iconImg); card.appendChild(infoDiv); card.appendChild(selectBtn);
            modelListContainer.appendChild(card);
        });
        initializeModelSelection();
    }

    function initializeModelSelection() {
        if (!modelListContainer) return;
        const modelCards = modelListContainer.querySelectorAll('.model-card');
        modelCards.forEach(card => {
            const selectBtn = card.querySelector('.select-model-btn');
            if (selectBtn && !card.dataset.listenerAttached) {
                selectBtn.addEventListener('click', async () => {
                    modelCards.forEach(c => c.classList.remove('selected-model'));
                    card.classList.add('selected-model');
                    const modelId = card.dataset.modelId;
                    const modelName = card.querySelector('h4').textContent;
                    selectedModel = { id: modelId, name: modelName };
                    if (selectedModelNameProviderTitle) selectedModelNameProviderTitle.textContent = modelName;
                    if (providerSelectionSection) providerSelectionSection.style.display = 'block';
                    selectedProvider = null;
                    if (providerListContainer) {
                        const currentProviderCards = providerListContainer.querySelectorAll('.provider-card');
                        currentProviderCards.forEach(pCard => pCard.classList.remove('selected-provider'));
                    }
                    try {
                        const providers = await fetchProvidersForModelFromBackend(selectedModel.id);
                        renderProviderCards(providers);
                    } catch (error) { console.error("Failed to render providers:", error); }
                    console.log('Selected Model:', selectedModel);
                });
                card.dataset.listenerAttached = 'true';
            }
        });
    }

    function renderProviderCards(providersData) {
        if (!providerListContainer) return;
        providerListContainer.innerHTML = '';
        const providers = providersData || [];
        if (providers.length === 0) {
            providerListContainer.innerHTML = '<p class="no-providers-message">No providers available for this model.</p>';
            return;
        }
        providers.forEach(provider => {
            const providerCard = document.createElement('div'); providerCard.classList.add('provider-card'); providerCard.dataset.providerId = provider.providerId;
            const logoImg = document.createElement('img'); logoImg.src = provider.providerIconUrl || 'icons/default-provider-logo.png'; logoImg.alt = `${provider.providerName} Logo`; logoImg.classList.add('provider-logo'); logoImg.onerror = () => { logoImg.src = 'icons/default-provider-logo.png'; };
            const providerInfoDiv = document.createElement('div'); providerInfoDiv.classList.add('provider-card-info');
            const providerNameH4 = document.createElement('h4'); providerNameH4.textContent = provider.providerName; providerInfoDiv.appendChild(providerNameH4);
            if (provider.notes) { const notesP = document.createElement('p'); notesP.classList.add('provider-notes'); notesP.textContent = provider.notes; providerInfoDiv.appendChild(notesP); }
            if (provider.tiers && provider.tiers.length > 0) {
                provider.tiers.forEach(tier => {
                    const tierDiv = document.createElement('div'); tierDiv.classList.add('tier-info'); tierDiv.dataset.tierId = tier.tierId;
                    const tierNameSpan = document.createElement('span'); tierNameSpan.classList.add('tier-name');
                    if (tier.tierIconClass) { const iconI = document.createElement('i'); iconI.className = tier.tierIconClass; tierNameSpan.appendChild(iconI); tierNameSpan.appendChild(document.createTextNode(" ")); }
                    tierNameSpan.appendChild(document.createTextNode(tier.tierName)); tierDiv.appendChild(tierNameSpan);
                    if (tier.specs) { const specsP = document.createElement('p'); specsP.classList.add('tier-specs'); specsP.textContent = tier.specs; tierDiv.appendChild(specsP); }
                    const priceSpan = document.createElement('span'); priceSpan.classList.add('price-prediction'); priceSpan.textContent = tier.pricePrediction || 'N/A';
                    if (tier.priceDetails) {
                        const infoIcon = document.createElement('i'); infoIcon.className = 'fas fa-info-circle';
                        let titleText = 'Details: ';
                        if(tier.priceDetails.promptTokensPer1k) titleText += `Prompt ${tier.priceDetails.promptTokensPer1k}, `;
                        if(tier.priceDetails.completionTokensPer1k) titleText += `Completion ${tier.priceDetails.completionTokensPer1k}, `;
                        if(tier.priceDetails.per1kTokens) titleText += `${tier.priceDetails.per1kTokens} per 1k tokens, `;
                        if(tier.priceDetails.perHour) titleText += `${tier.priceDetails.perHour} per hour, `;
                        titleText += `Unit: ${tier.priceDetails.unit || 'N/A'}, Currency: ${tier.priceDetails.currency || 'N/A'}`;
                        infoIcon.title = titleText.replace(/,\s*$/, ""); priceSpan.appendChild(infoIcon);
                    }
                    tierDiv.appendChild(priceSpan); providerInfoDiv.appendChild(tierDiv);
                });
            }
            const selectProviderBtn = document.createElement('button'); selectProviderBtn.classList.add('select-provider-btn'); selectProviderBtn.textContent = 'Use this Provider';
            providerCard.appendChild(logoImg); providerCard.appendChild(providerInfoDiv); providerCard.appendChild(selectProviderBtn);
            providerListContainer.appendChild(providerCard);
        });
    }


    // Event Listeners
    if (sendMessageBtn) sendMessageBtn.addEventListener('click', handleSendMessage);
    if (messageInput) {
        messageInput.addEventListener('keypress', (event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); handleSendMessage();}});
        messageInput.addEventListener('input', () => { messageInput.style.height = 'auto'; messageInput.style.height = (messageInput.scrollHeight) + 'px'; });
    }

    // Old config panel toggle (if configPanelBtn still existed for an overlay panel)
    // if (configPanelBtn && configPanel) {
    //     configPanelBtn.addEventListener('click', () => {
    //         configPanel.style.display = 'block';
    //         fetchModelsFromBackend().then(models => { renderModelCards(models); });
    //     });
    // }
    // if (closeConfigPanelBtnInside && configPanel) { // For old overlay panel's close button
    //     closeConfigPanelBtnInside.addEventListener('click', () => {
    //         configPanel.style.display = 'none';
    //         resetConfigPanelState(); // This reset might need to be smarter if panel is just hidden
    //     });
    // }

    // New: Settings button to toggle sidebar config area
    if (settingsBtn && sidebarConfigArea) {
        settingsBtn.addEventListener('click', () => {
            const isConfigAreaVisible = sidebarConfigArea.style.display === 'block';
            sidebarConfigArea.style.display = isConfigAreaVisible ? 'none' : 'block';
            if (isConfigAreaVisible) { // If was visible and now closing
                resetConfigPanelState();
            } else { // If opening
                // Initial state of model section when settings open (before engine selection)
                if (!selectedEngine && modelSelectionSection) {
                     modelSelectionSection.style.display = 'none';
                }
            }
        });
    }

    // New: Engine Selection Logic
    if (engineOptionsContainer) {
        const radioButtons = engineOptionsContainer.querySelectorAll('input[type="radio"][name="engineSelection"]');
        radioButtons.forEach(radio => {
            radio.addEventListener('change', () => {
                engineOptionsContainer.querySelectorAll('.engine-option').forEach(div => div.classList.remove('selected'));
                if (radio.checked) {
                    radio.parentElement.classList.add('selected');
                    selectedEngine = radio.value;
                    if (modelSelectionSection) modelSelectionSection.style.display = 'block';
                    if (modelSectionContext) {
                        const selectedLabel = engineOptionsContainer.querySelector(`label[for='${radio.id}']`);
                        modelSectionContext.textContent = `(for ${selectedLabel.textContent})`;
                    }
                    // Reset downstream selections
                    if (providerSelectionSection) providerSelectionSection.style.display = 'none';
                    if (providerListContainer) providerListContainer.innerHTML = '';
                    selectedProvider = null;
                    selectedModel = null;
                    if(modelListContainer) modelListContainer.innerHTML = ''; // Clear previous models
                    document.querySelectorAll('.model-card.selected-model').forEach(c => c.classList.remove('selected-model'));


                    if (selectedEngine === 'local_llama') {
                        if (modelListContainer) modelListContainer.innerHTML = '<p class="info-message">Local Llama: Model management TBD. Search below.</p>';
                        if(modelSearchInput) modelSearchInput.placeholder = "Search local/downloadable models...";
                    } else if (selectedEngine.startsWith('cloud_provider_')) {
                        if(modelSearchInput) modelSearchInput.placeholder = "Search Hugging Face models...";
                        fetchModelsFromBackend({}).then(models => { renderModelCards(models); });
                    }
                }
                console.log('Selected Engine:', selectedEngine);
            });
        });
    }

    if (providerListContainer) {
        providerListContainer.addEventListener('click', (event) => {
            const target = event.target;
            const selectBtn = target.closest('.select-provider-btn');
            let cardToSelect = null; let specificTierId = null; let specificTierName = ''; let specificPrice = '';
            if (selectBtn) {
                cardToSelect = selectBtn.closest('.provider-card');
                const firstTierElement = cardToSelect.querySelector('.tier-info');
                if (firstTierElement) {
                    specificTierId = firstTierElement.dataset.tierId;
                    specificTierName = firstTierElement.querySelector('.tier-name')?.textContent.trim() || 'N/A';
                    specificPrice = firstTierElement.querySelector('.price-prediction')?.textContent.trim() || 'N/A';
                }
            }
            if (cardToSelect) {
                const allProviderCards = providerListContainer.querySelectorAll('.provider-card');
                allProviderCards.forEach(c => c.classList.remove('selected-provider'));
                cardToSelect.classList.add('selected-provider');
                const providerId = cardToSelect.dataset.providerId;
                const providerName = cardToSelect.querySelector('h4').textContent;
                selectedProvider = { id: providerId, name: providerName, tierId: specificTierId || providerId, tier: specificTierName || 'Default Tier', price: specificPrice };
                console.log('Selected Provider:', selectedProvider);
            }
        });
    }

    // Modified applyConfigBtn listener
    if (applyConfigBtn) {
        applyConfigBtn.addEventListener('click', () => {
            if (selectedEngine && selectedModel && selectedProvider) { // Check selectedEngine
                if (activeConfigDisplay) activeConfigDisplay.textContent = `Engine: ${selectedEngine}, Model: ${selectedModel.name}, Provider: ${selectedProvider.name} (${selectedProvider.tier}) - ${selectedProvider.price}`;
                if (sidebarConfigArea) sidebarConfigArea.style.display = 'none'; // Hide sidebar config area
                console.log('Configuration Applied:', { engine: selectedEngine, model: selectedModel, provider: selectedProvider });
                resetConfigPanelState();
            } else {
                alert('Please select an engine, a model, and a provider/tier.'); // Updated alert
            }
        });
    }

    // Modified modelSearchInput listener
    if (modelSearchInput && modelListContainer) {
        let searchTimeout;
        modelSearchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                const searchTerm = modelSearchInput.value.trim();
                if (selectedEngine && selectedEngine.startsWith('cloud_provider_')) {
                   fetchModelsFromBackend({ searchTerm: searchTerm, limit: 20 }).then(models => {
                       renderModelCards(models);
                   });
                } else if (selectedEngine === 'local_llama') {
                   if (modelListContainer) modelListContainer.innerHTML = `<p class="info-message">Searching local models for '${searchTerm}' is TBD.</p>`;
                } else {
                   // Default to searching cloud if no engine selected, or prompt selection
                   if (modelListContainer && !selectedEngine) modelListContainer.innerHTML = '<p class="info-message">Please select an engine to search models.</p>';
                   else if (modelListContainer) fetchModelsFromBackend({ searchTerm: searchTerm, limit: 20 }).then(models => { renderModelCards(models); }); // Fallback to cloud search if engine state unclear
                }
            }, 300);
        });
    }

    // Initial UI setup calls
    // resetConfigPanelState(); // Call reset to load initial models if sidebarConfigArea is open by default
    // If sidebarConfigArea is hidden by default, this call might be better placed in settingsBtn listener when it's opened.
    // For now, let's assume it's hidden and models load when settings is clicked.
});
