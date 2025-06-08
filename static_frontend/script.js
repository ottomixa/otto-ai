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

    // Create Ollama Configuration Section Dynamically
    const ollamaConfigSection = document.createElement('section');
    ollamaConfigSection.id = 'ollamaConfigSection';
    ollamaConfigSection.classList.add('ollama-config-section'); // For styling
    ollamaConfigSection.style.display = 'none'; // Initially hidden

    const ollamaConfigTitle = document.createElement('h4');
    ollamaConfigTitle.textContent = 'Ollama Configuration';
    ollamaConfigSection.appendChild(ollamaConfigTitle);

    const formGroupUrl = document.createElement('div');
    formGroupUrl.classList.add('form-group');

    const ollamaApiUrlLabel = document.createElement('label');
    ollamaApiUrlLabel.setAttribute('for', 'ollamaApiUrlInput');
    ollamaApiUrlLabel.textContent = 'Ollama API URL:';
    formGroupUrl.appendChild(ollamaApiUrlLabel);

    const ollamaApiUrlInput = document.createElement('input');
    ollamaApiUrlInput.type = 'text';
    ollamaApiUrlInput.id = 'ollamaApiUrlInput';
    ollamaApiUrlInput.classList.add('text-input');
    ollamaApiUrlInput.value = 'http://localhost:11434'; // Default value
    formGroupUrl.appendChild(ollamaApiUrlInput);
    ollamaConfigSection.appendChild(formGroupUrl);

    const testOllamaConnectionBtn = document.createElement('button');
    testOllamaConnectionBtn.id = 'testOllamaConnectionBtn';
    testOllamaConnectionBtn.classList.add('sidebar-button', 'test-connection-btn');
    testOllamaConnectionBtn.textContent = 'Test Connection';
    ollamaConfigSection.appendChild(testOllamaConnectionBtn);

    const ollamaConnectionStatus = document.createElement('div');
    ollamaConnectionStatus.id = 'ollamaConnectionStatus';
    ollamaConnectionStatus.classList.add('connection-status-message');
    ollamaConnectionStatus.style.display = 'none'; // Initially hidden
    ollamaConfigSection.appendChild(ollamaConnectionStatus);

    // Insert the new section before modelSelectionSection within sidebarConfigArea
    if (sidebarConfigArea && modelSelectionSection) {
        sidebarConfigArea.insertBefore(ollamaConfigSection, modelSelectionSection);
    } else if (sidebarConfigArea) { // Fallback if modelSelectionSection somehow not found
        sidebarConfigArea.appendChild(ollamaConfigSection);
    }
    // End Create Ollama Configuration Section

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
        params.append('limit', limit); params.append('page', page); params.append('sort_by', sortBy); params.append('direction', direction); // Corrected: sort_by
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

        // Also hide Ollama section and clear its status
        if (ollamaConfigSection) ollamaConfigSection.style.display = 'none';
        if (ollamaConnectionStatus) {
            ollamaConnectionStatus.textContent = '';
            ollamaConnectionStatus.style.display = 'none';
            ollamaConnectionStatus.className = 'connection-status-message'; // Reset class
        }
        console.log('Config panel state FULLY reset.');
    }

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

    // Moved triggerDownload before renderModelCards and initializeModelSelection
    async function triggerDownload(modelId) {
        console.log(`Requesting download for model: ${modelId}`);
        // Ensure backendBaseUrl is defined and accessible (it's global in the provided script.js)
        try {
            const response = await fetch(`${backendBaseUrl}/hf-models/${encodeURIComponent(modelId)}/download`, {
                method: 'POST',
                headers: {
                    // 'Content-Type': 'application/json', // Not strictly needed for this POST if no body is sent
                },
                // No body is sent for this specific download trigger
            });

            const result = await response.json(); // Assuming backend always sends JSON response

            if (response.ok) {
                console.log('Download request successful:', result);
                // Display a user-friendly message
                alert(`Download status for ${result.model_id || modelId}: ${result.message}`);
            } else {
                console.error('Download request failed:', result);
                alert(`Failed to start download for ${modelId}: ${result.detail || result.message || 'Unknown server error'}`);
            }
        } catch (error) {
            console.error('Error during download request function:', error);
            alert(`Client-side error requesting download for ${modelId}: ${error.message}`);
        }
    }

    function renderModelCards(modelsToRender) {
        if (!modelListContainer) return;

        if (!modelsToRender || modelsToRender.length === 0) {
            // Assumes fetchModelsFromBackend handles messages for empty/error states
            return;
        }

        const fragment = document.createDocumentFragment(); // Create fragment

        modelsToRender.forEach(model => {
            const card = document.createElement('div');
            card.classList.add('model-card');
            card.dataset.modelId = model.id;

            const iconImg = document.createElement('img');
            iconImg.src = model.iconUrl || 'icons/default-model-icon.png';
            iconImg.alt = `${model.name || model.id} Icon`;
            iconImg.classList.add('model-icon');
            iconImg.onerror = () => {
                iconImg.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
                iconImg.alt = 'Icon not available';
            };
            card.appendChild(iconImg); // Icon is a direct child of card

            const infoDiv = document.createElement('div');
            infoDiv.classList.add('model-card-info');

            const nameH4 = document.createElement('h4');
            nameH4.textContent = model.name || model.id;
            infoDiv.appendChild(nameH4); // Name is child of infoDiv

            // Buttons will now be children of infoDiv, after the name
            if (selectedEngine === 'local_llama') {
                const downloadBtn = document.createElement('button');
                downloadBtn.classList.add('download-model-btn');
                downloadBtn.textContent = 'Download';
                downloadBtn.dataset.modelId = model.id;

                downloadBtn.addEventListener('click', (event) => {
                    event.stopPropagation();
                    const modelIdToDownload = event.currentTarget.dataset.modelId;
                    triggerDownload(modelIdToDownload);
                });
                infoDiv.appendChild(downloadBtn); // Append Download button to infoDiv
            }

            const selectBtn = document.createElement('button');
            selectBtn.classList.add('select-model-btn');
            selectBtn.textContent = 'Select';
            infoDiv.appendChild(selectBtn); // Append Select button to infoDiv

            card.appendChild(infoDiv); // Append infoDiv (containing name and buttons) to card

            fragment.appendChild(card); // Append card to fragment
        });

        // After loop, update DOM once
        modelListContainer.innerHTML = '';
        modelListContainer.appendChild(fragment);

        initializeModelSelection();
    }

    function initializeModelSelection() {
        if (!modelListContainer) return;
        const modelCards = modelListContainer.querySelectorAll('.model-card');
        modelCards.forEach(card => {
            const selectBtn = card.querySelector('.select-model-btn');
            // Check if listener already attached to prevent duplicates if re-rendering
            if (selectBtn && !card.dataset.selectListenerAttached) {
                selectBtn.addEventListener('click', async () => {
                    modelCards.forEach(c => c.classList.remove('selected-model'));
                    card.classList.add('selected-model');
                    const modelId = card.dataset.modelId;
                    const modelName = card.querySelector('h4').textContent;
                    selectedModel = { id: modelId, name: modelName };
                    if (selectedModelNameProviderTitle) selectedModelNameProviderTitle.textContent = modelName;
                    if (providerSelectionSection) providerSelectionSection.style.display = 'block';
                    selectedProvider = null; // Reset provider when new model is selected
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
                card.dataset.selectListenerAttached = 'true'; // Mark as listener attached
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
                        const infoIcon = document.createElement('i'); infoIcon.className = 'fas fa-info-circle'; // Assuming Font Awesome or similar
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

    if (settingsBtn && sidebarConfigArea) {
        settingsBtn.addEventListener('click', () => {
            const isConfigAreaVisible = sidebarConfigArea.style.display === 'block';
            sidebarConfigArea.style.display = isConfigAreaVisible ? 'none' : 'block';
            if (isConfigAreaVisible) {
                resetConfigPanelState(); // Reset state when hiding
            } else {
                // When showing, ensure engine selection is primary if nothing is selected
                if (!selectedEngine && modelSelectionSection) {
                     modelSelectionSection.style.display = 'none'; // Hide model section until engine is chosen
                }
                 // If no engine selected, maybe pre-select one or prompt user? For now, it just shows.
            }
        });
    }

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
                    // Reset subsequent selections
                    if (providerSelectionSection) providerSelectionSection.style.display = 'none';
                    if (providerListContainer) providerListContainer.innerHTML = '';
                    selectedProvider = null;
                    selectedModel = null;
                    if(modelListContainer) modelListContainer.innerHTML = '';
                    document.querySelectorAll('.model-card.selected-model').forEach(c => c.classList.remove('selected-model'));

                    if (selectedEngine === 'local_llama') {
                        if(modelSearchInput) modelSearchInput.placeholder = "Search Hugging Face models to download...";
                        if (ollamaConfigSection) ollamaConfigSection.style.display = 'block'; // Show Ollama config
                        // Model selection for local_llama will be from HF, so show that section too
                        if (modelSelectionSection) modelSelectionSection.style.display = 'block';
                        fetchModelsFromBackend({}).then(models => { renderModelCards(models); });
                    } else if (selectedEngine.startsWith('cloud_provider_')) {
                        if(modelSearchInput) modelSearchInput.placeholder = "Search Hugging Face models...";
                        if (ollamaConfigSection) ollamaConfigSection.style.display = 'none'; // Hide Ollama config
                        if (modelSelectionSection) modelSelectionSection.style.display = 'block';
                        fetchModelsFromBackend({}).then(models => { renderModelCards(models); });
                    } else {
                        // For any other engine or if no engine is truly selected
                        if (ollamaConfigSection) ollamaConfigSection.style.display = 'none';
                        if (modelSelectionSection) modelSelectionSection.style.display = 'none';
                    }
                } else { // If no radio button is checked (e.g. after reset)
                    if (ollamaConfigSection) ollamaConfigSection.style.display = 'none';
                    if (modelSelectionSection) modelSelectionSection.style.display = 'none';
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
                const firstTierElement = cardToSelect.querySelector('.tier-info'); // Assuming first tier is representative or only one tier per card for selection
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

    if (applyConfigBtn) {
        applyConfigBtn.addEventListener('click', () => {
            let configComplete = false;
            if (selectedEngine === 'local_llama' && selectedModel) {
                // For local_llama, provider selection might be optional or not applicable
                // For this example, we'll consider it complete if a model is selected.
                // The "Download" button handles the action. "Apply" might mean setting it as active for chat (future).
                // For now, let's assume "Apply" means it's ready for chat.
                selectedProvider = { name: "Local Execution", tier: "N/A", price: "N/A" }; // Placeholder provider for local
                configComplete = true;
                if (activeConfigDisplay) activeConfigDisplay.textContent = `Engine: Local Llama, Model: ${selectedModel.name}`;
            } else if (selectedEngine && selectedEngine.startsWith('cloud_provider_') && selectedModel && selectedProvider) {
                configComplete = true;
                if (activeConfigDisplay) activeConfigDisplay.textContent = `Engine: ${selectedEngine}, Model: ${selectedModel.name}, Provider: ${selectedProvider.name} (${selectedProvider.tier}) - ${selectedProvider.price}`;
            }

            if (configComplete) {
                if (sidebarConfigArea) sidebarConfigArea.style.display = 'none';
                console.log('Configuration Applied:', { engine: selectedEngine, model: selectedModel, provider: selectedProvider });
                resetConfigPanelState(); // Reset after applying
            } else {
                alert('Please select an engine, a model, and for cloud engines, a provider/tier.');
            }
        });
    }

    if (modelSearchInput && modelListContainer) {
        let searchTimeout;
        modelSearchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                const searchTerm = modelSearchInput.value.trim();
                fetchModelsFromBackend({ searchTerm: searchTerm, limit: 20 }).then(models => {
                   renderModelCards(models);
                });
            }, 300);
        });
    }

    // Initial fetch for default view (e.g., when settings panel is opened without engine pre-selection)
    // This part might be removed if an engine must always be selected first to show models.
    // fetchModelsFromBackend({}).then(models => renderModelCards(models));

    // Event listener for Test Ollama Connection button
    if (testOllamaConnectionBtn) {
        testOllamaConnectionBtn.addEventListener('click', async () => {
            const ollamaUrl = ollamaApiUrlInput.value.trim();
            if (!ollamaUrl) {
                ollamaConnectionStatus.textContent = 'Ollama API URL cannot be empty.';
                ollamaConnectionStatus.className = 'connection-status-message status-failure';
                ollamaConnectionStatus.style.display = 'block';
                return;
            }

            ollamaConnectionStatus.textContent = 'Testing connection...';
            ollamaConnectionStatus.className = 'connection-status-message';
            ollamaConnectionStatus.style.display = 'block';

            try {
                const response = await fetch(`${backendBaseUrl}/ollama/test-connection`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ url: ollamaUrl }),
                });

                const result = await response.json();

                ollamaConnectionStatus.textContent = result.message;
                if (response.ok && result.status === 'success') {
                    ollamaConnectionStatus.className = 'connection-status-message status-success';
                } else {
                    ollamaConnectionStatus.className = 'connection-status-message status-failure';
                }
            } catch (error) {
                console.error('Error testing Ollama connection:', error);
                ollamaConnectionStatus.textContent = 'Client-side error: Could not reach backend or parse response.';
                ollamaConnectionStatus.className = 'connection-status-message status-failure';
            }
            ollamaConnectionStatus.style.display = 'block';
        });
    }
});

// Note: triggerDownload function moved up within DOMContentLoaded
// Note: Corrected sort_by param in fetchModelsFromBackend
// Note: Improved selectedModel/Provider reset logic in engine selection
// Note: Corrected listener attachment in initializeModelSelection to avoid duplicates
// Note: Modified applyConfigBtn logic for local_llama
// Note: Ensured initializeModelSelection is called after rendering cards.
// Note: Placeholder for download button logic added in renderModelCards
// Note: Placeholder for triggerDownload function added at the end
