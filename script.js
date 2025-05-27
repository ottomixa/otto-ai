document.addEventListener('DOMContentLoaded', () => {
    const messageList = document.getElementById('messageList');
    const messageInput = document.getElementById('messageInput');
    const sendMessageBtn = document.getElementById('sendMessageBtn');
    const configPanelBtn = document.getElementById('configPanelBtn');
    const configPanel = document.getElementById('configPanel');
    
    const closeConfigPanelBtnInside = document.getElementById('closeConfigPanelBtnInside');
    const modelListContainer = document.getElementById('modelList');
    const providerSelectionSection = document.getElementById('providerSelectionSection');
    const selectedModelNameProviderTitle = document.getElementById('selectedModelNameProviderTitle');
    const applyConfigBtn = document.getElementById('applyConfigBtn');
    const activeConfigDisplay = document.getElementById('activeConfigDisplay');
    const modelSearchInput = document.getElementById('modelSearchInput');
    const providerListContainer = document.getElementById('providerList');

    const backendBaseUrl = 'http://127.0.0.1:8000/api/v1'; 

    let selectedModel = null; 
    let selectedProvider = null; 

    const MOCK_PROVIDER_DATA = {
        "llama2-7b-chat": [
            {"providerId": "replicate", "providerName": "Replicate", "providerIconUrl": "icons/replicate-logo.png", "notes": "Fast cold starts.", "tiers": [{"tierId": "replicate-t4", "tierName": "Standard (NVIDIA T4)", "tierIconClass": "fas fa-gpu", "specs": "NVIDIA T4 GPU", "pricePrediction": "Est. $0.0015 / 1k tokens", "priceDetails": { "per1kTokens": 0.0015, "unit": "1k tokens"}}]},
            {"providerId": "supercompute", "providerName": "SuperCompute", "providerIconUrl": "icons/supercompute-logo.png", "notes": "Good for large jobs.", "tiers": [{"tierId": "sc-a100", "tierName": "Large (NVIDIA A100)", "tierIconClass": "fas fa-server", "specs": "NVIDIA A100 GPU", "pricePrediction": "Est. $1.20 / hour", "priceDetails": { "perHour": 1.20, "unit": "hour"}}]}
        ],
        "meta-llama/Llama-2-7b-chat": [ // Example if backend returns full ID
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
          
    async function fetchModelsFromBackend(
        { searchTerm = '', limit = 10, page = 1, sortBy = 'downloads', direction = 'desc' } = {}
    ) {
        console.log(`Fetching models from backend: search='${searchTerm}', limit=${limit}, page=${page}, sort=${sortBy}, dir=${direction}`);
        if (modelListContainer) modelListContainer.innerHTML = '<p class="loading-message">Loading models...</p>';

        const params = new URLSearchParams();
        if (searchTerm) params.append('search', searchTerm);
        params.append('limit', limit);
        params.append('page', page);
        params.append('sort', sortBy);
        params.append('direction', direction);

        try {
            const response = await fetch(`${backendBaseUrl}/external-models/huggingface?${params.toString()}`);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ detail: "Unknown error fetching models" }));
                console.error('Error fetching models:', response.status, errorData);
                if (modelListContainer) modelListContainer.innerHTML = `<p class="error-message">Error: ${errorData.detail || response.statusText}</p>`;
                return [];
            }
            const responseData = await response.json();
            console.log('Models fetched from backend:', responseData);
            return responseData.data || []; 
        } catch (error) {
            console.error('Network or other error fetching models:', error);
            if (modelListContainer) modelListContainer.innerHTML = '<p class="error-message">Network error. Ensure backend is running and accessible (check CORS).</p>';
            return [];
        }
    }
    
    async function fetchProvidersForModelFromBackend(modelId) {
        console.log(`Fetching providers for model (simulated): ${modelId}...`);
        if (providerListContainer) {
            providerListContainer.innerHTML = '<p class="loading-message">Loading providers...</p>';
        }

        await new Promise(resolve => setTimeout(resolve, 300)); // Simulate network delay

        try {
            // This is where a real API call would go, e.g.:
            // const response = await fetch(`${backendBaseUrl}/providers-for-model/${modelId}`);
            // if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            // const providerData = await response.json();
            // return providerData.data || [];

            // Using mock data:
            const providers = MOCK_PROVIDER_DATA[modelId] || MOCK_PROVIDER_DATA[modelId.split('/').pop()] || [];
            console.log('Mock providers resolved:', providers);
             if (providers.length === 0 && modelId) {
                 console.warn(`No mock providers found for modelId: ${modelId}`);
            }
            return providers;
        } catch (error) {
            console.error(`Error fetching/simulating providers for model ${modelId}:`, error);
            if (providerListContainer) {
                providerListContainer.innerHTML = `<p class="error-message">Error loading providers for ${modelId}.</p>`;
            }
            return [];
        }
    }

    function resetConfigPanelState() { /* ... (implementation as before, uses new fetchModelsFromBackend) ... */ 
        selectedModel = null;
        selectedProvider = null;
        if (providerListContainer) providerListContainer.innerHTML = ''; 
        if (providerSelectionSection) providerSelectionSection.style.display = 'none';
        if (selectedModelNameProviderTitle) selectedModelNameProviderTitle.textContent = '';
        if (modelSearchInput) modelSearchInput.value = '';
        fetchModelsFromBackend().then(models => { renderModelCards(models); }); // Default fetch
        console.log('Config panel state reset.');
    }

    function addMessage(text, sender) { /* ... (implementation as before) ... */ 
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
    function handleSendMessage() { /* ... (implementation as before) ... */ 
        if (!messageInput) return;
        const text = messageInput.value.trim();
        if (text) { addMessage(text, 'user'); messageInput.value = ''; setTimeout(() => simulateAIResponse(text), 1000); }
    }
    function simulateAIResponse(userText) { /* ... (implementation as before) ... */ addMessage(`Mock AI received: '${userText}'`, 'ai'); }
    
    function renderModelCards(modelsToRender) { /* ... (implementation as before) ... */ 
        if (!modelListContainer) return;
        modelListContainer.innerHTML = ''; 
        modelsToRender.forEach(model => {
            const card = document.createElement('div'); card.classList.add('model-card'); card.dataset.modelId = model.id;
            const iconImg = document.createElement('img'); iconImg.src = model.iconUrl || 'icons/default-model-icon.png'; iconImg.alt = `${model.name} Icon`; iconImg.classList.add('model-icon'); iconImg.onerror = () => { iconImg.src = 'icons/default-model-icon.png'; };
            const infoDiv = document.createElement('div'); infoDiv.classList.add('model-card-info');
            const nameH4 = document.createElement('h4'); nameH4.textContent = model.name; infoDiv.appendChild(nameH4);
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
                selectBtn.addEventListener('click', async () => { // Made this async
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
                        // providerListContainer.innerHTML = '<p class="loading-message">Loading providers...</p>'; // Moved inside fetch function
                    }
                    try {
                        const providers = await fetchProvidersForModelFromBackend(selectedModel.id);
                        renderProviderCards(providers); 
                    } catch (error) {
                        console.error("Failed to render providers due to fetch error:", error);
                        // Error message is handled inside fetchProvidersForModelFromBackend
                    }
                    console.log('Selected Model:', selectedModel);
                });
                card.dataset.listenerAttached = 'true'; 
            }
        });
    }

    function renderProviderCards(providersData) { /* ... (implementation as before, check providerListContainer) ... */ 
        if (!providerListContainer) return;
        providerListContainer.innerHTML = ''; 
        const providers = providersData || []; 
        if (providers.length === 0) {
            providerListContainer.innerHTML = '<p class="no-providers-message">No providers currently available for this model.</p>';
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

    if (sendMessageBtn) sendMessageBtn.addEventListener('click', handleSendMessage);
    if (messageInput) {
        messageInput.addEventListener('keypress', (event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); handleSendMessage();}});
        messageInput.addEventListener('input', () => { messageInput.style.height = 'auto'; messageInput.style.height = (messageInput.scrollHeight) + 'px'; });
    }
    if (configPanelBtn && configPanel) {
        configPanelBtn.addEventListener('click', () => {
            configPanel.style.display = 'block';
            fetchModelsFromBackend().then(models => { renderModelCards(models); });
        });
    }
    if (closeConfigPanelBtnInside && configPanel) {
        closeConfigPanelBtnInside.addEventListener('click', () => {
            configPanel.style.display = 'none'; resetConfigPanelState(); 
        });
    }
    if (providerListContainer) { /* ... (provider selection logic as before) ... */ 
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
    if (applyConfigBtn) { /* ... (apply config logic as before) ... */ 
        applyConfigBtn.addEventListener('click', () => {
            if (selectedModel && selectedProvider) {
                if (activeConfigDisplay) activeConfigDisplay.textContent = `Model: ${selectedModel.name}, Provider: ${selectedProvider.name} (${selectedProvider.tier}) - ${selectedProvider.price}`;
                if (configPanel) configPanel.style.display = 'none';
                console.log('Configuration Applied:', { model: selectedModel, provider: selectedProvider });
                resetConfigPanelState(); 
            } else {
                alert('Please select both a model and a provider/tier.');
            }
        });
    }
    if (modelSearchInput && modelListContainer) { /* ... (search logic as before) ... */ 
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
});
