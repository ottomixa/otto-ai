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

    let selectedModel = null; 
    let selectedProvider = null; 

    const mockModelsData = [
      {
        "id": "llama2-7b-chat",
        "name": "Llama 2 7B Chat",
        "creator": "Meta",
        "description": "A versatile 7B parameter chat model.",
        "iconUrl": "icons/llama-icon.png",
        "tags": ["chat", "general", "7B"]
      },
      {
        "id": "mistral-7b-instruct",
        "name": "Mistral 7B Instruct",
        "creator": "Mistral AI",
        "description": "High-performing instruction model.",
        "iconUrl": "icons/mistral-icon.png",
        "tags": ["instruction", "efficient", "7B"]
      },
      {
        "id": "codellama-13b",
        "name": "CodeLlama 13B",
        "creator": "Meta",
        "description": "Specialized for code generation.",
        "iconUrl": "icons/codellama-icon.png",
        "tags": ["code", "13B"]
      }
    ];

    const mockProviderData = {
        "llama2-7b-chat": [
            {
                "providerId": "replicate",
                "providerName": "Replicate",
                "providerIconUrl": "icons/replicate-logo.png",
                "notes": "Fast cold starts, pay-per-second billing.",
                "tiers": [
                    {
                        "tierId": "replicate-t4",
                        "tierName": "Standard (NVIDIA T4)",
                        "tierIconClass": "fas fa-gpu", 
                        "specs": "NVIDIA T4 GPU, 16GB VRAM",
                        "pricePrediction": "Est. $0.0015 / 1k tokens",
                        "priceDetails": { "per1kTokens": 0.0015, "unit": "1k tokens", "currency": "USD" }
                    }
                ]
            },
            {
                "providerId": "supercompute-cloud",
                "providerName": "SuperCompute Cloud",
                "providerIconUrl": "icons/supercompute-logo.png",
                "notes": "Offers sustained usage discounts.",
                "tiers": [
                    {
                        "tierId": "sc-a100-large",
                        "tierName": "Large (NVIDIA A100)",
                        "tierIconClass": "fas fa-server",
                        "specs": "NVIDIA A100 GPU, 40GB VRAM",
                        "pricePrediction": "Est. $1.20 / hour",
                        "priceDetails": { "perHour": 1.20, "unit": "hour", "currency": "USD" }
                    }
                ]
            }
        ],
        "mistral-7b-instruct": [
            {
                "providerId": "replicate",
                "providerName": "Replicate",
                "providerIconUrl": "icons/replicate-logo.png",
                "notes": "Excellent for Mistral models.",
                "tiers": [
                    {
                        "tierId": "replicate-mistral-t4",
                        "tierName": "Standard (NVIDIA T4)",
                        "tierIconClass": "fas fa-gpu",
                        "specs": "NVIDIA T4 GPU, 16GB VRAM",
                        "pricePrediction": "Est. $0.0007 / 1k tokens",
                        "priceDetails": { "per1kTokens": 0.0007, "unit": "1k tokens", "currency": "USD" }
                    }
                ]
            }
        ],
        "codellama-13b": [] // No providers for this model in mock data
    };

    function resetConfigPanelState() {
        selectedModel = null;
        selectedProvider = null;
        if (providerListContainer) providerListContainer.innerHTML = ''; 
        if (providerSelectionSection) providerSelectionSection.style.display = 'none';
        if (selectedModelNameProviderTitle) selectedModelNameProviderTitle.textContent = '';
        if (modelSearchInput) modelSearchInput.value = '';
        renderModelCards(mockModelsData); 
        console.log('Config panel state reset.');
    }

    function addMessage(text, sender) { 
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', sender === 'user' ? 'user-message' : 'ai-message');
        const paragraph = document.createElement('p');
        paragraph.textContent = text;
        messageDiv.appendChild(paragraph);
        const timestampSpan = document.createElement('span');
        timestampSpan.classList.add('timestamp');
        timestampSpan.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        messageDiv.appendChild(timestampSpan);
        if (messageList) messageList.appendChild(messageDiv);
        if (messageList) messageList.scrollTop = messageList.scrollHeight;
    }
    function handleSendMessage() { 
        const text = messageInput.value.trim();
        if (text) {
            addMessage(text, 'user');
            messageInput.value = '';
            setTimeout(() => simulateAIResponse(text), 1000);
        }
    }
    function simulateAIResponse(userText) { 
        let aiText = "I am a mock AI. I received: '" + userText + "'";
        if (userText.toLowerCase().includes("hello") || userText.toLowerCase().includes("hi")) {
            aiText = "Hello there! How can I assist you today?";
        } else if (userText.toLowerCase().includes("how are you")) {
            aiText = "I'm doing well, thank you for asking!";
        }
        addMessage(aiText, 'ai');
    }
    
    function renderModelCards(modelsToRender) {
        if (!modelListContainer) return;
        modelListContainer.innerHTML = ''; 
        modelsToRender.forEach(model => {
            const card = document.createElement('div');
            card.classList.add('model-card');
            card.dataset.modelId = model.id;
            const iconImg = document.createElement('img');
            iconImg.src = model.iconUrl || 'icons/default-model-icon.png';
            iconImg.alt = `${model.name} Icon`;
            iconImg.classList.add('model-icon');
            iconImg.onerror = () => { iconImg.src = 'icons/default-model-icon.png'; };
            const infoDiv = document.createElement('div');
            infoDiv.classList.add('model-card-info');
            const nameH4 = document.createElement('h4');
            nameH4.textContent = model.name;
            infoDiv.appendChild(nameH4);
            const creatorP = document.createElement('p');
            creatorP.classList.add('model-creator');
            creatorP.textContent = model.creator;
            infoDiv.appendChild(creatorP);
            const descriptionP = document.createElement('p');
            descriptionP.classList.add('model-description');
            descriptionP.textContent = model.description;
            infoDiv.appendChild(descriptionP);
            if (model.tags && model.tags.length > 0) {
                const tagsDiv = document.createElement('div');
                tagsDiv.classList.add('model-tags');
                model.tags.forEach(tagText => {
                    const tagSpan = document.createElement('span');
                    tagSpan.classList.add('tag');
                    tagSpan.textContent = tagText;
                    tagsDiv.appendChild(tagSpan);
                });
                infoDiv.appendChild(tagsDiv);
            }
            const selectBtn = document.createElement('button');
            selectBtn.classList.add('select-model-btn');
            selectBtn.textContent = 'Select';
            card.appendChild(iconImg);
            card.appendChild(infoDiv);
            card.appendChild(selectBtn);
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
                selectBtn.addEventListener('click', () => {
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
                    renderProviderCards(selectedModel.id); 
                    console.log('Selected Model:', selectedModel);
                });
                card.dataset.listenerAttached = 'true'; 
            }
        });
    }

    function renderProviderCards(modelId) {
        if (!providerListContainer || !modelId) return;
        providerListContainer.innerHTML = ''; 
        const providers = mockProviderData[modelId] || [];
        if (providers.length === 0) {
            providerListContainer.innerHTML = '<p class="no-providers-message">No providers currently available for this model.</p>';
            return;
        }
        providers.forEach(provider => {
            const providerCard = document.createElement('div');
            providerCard.classList.add('provider-card');
            providerCard.dataset.providerId = provider.providerId;
            const logoImg = document.createElement('img');
            logoImg.src = provider.providerIconUrl || 'icons/default-provider-logo.png';
            logoImg.alt = `${provider.providerName} Logo`;
            logoImg.classList.add('provider-logo');
            logoImg.onerror = () => { logoImg.src = 'icons/default-provider-logo.png'; };
            const providerInfoDiv = document.createElement('div');
            providerInfoDiv.classList.add('provider-card-info');
            const providerNameH4 = document.createElement('h4');
            providerNameH4.textContent = provider.providerName;
            providerInfoDiv.appendChild(providerNameH4);
            if (provider.notes) {
                const notesP = document.createElement('p');
                notesP.classList.add('provider-notes');
                notesP.textContent = provider.notes;
                providerInfoDiv.appendChild(notesP);
            }
            if (provider.tiers && provider.tiers.length > 0) {
                provider.tiers.forEach(tier => {
                    const tierDiv = document.createElement('div');
                    tierDiv.classList.add('tier-info');
                    tierDiv.dataset.tierId = tier.tierId;
                    const tierNameSpan = document.createElement('span');
                    tierNameSpan.classList.add('tier-name');
                    if (tier.tierIconClass) {
                        const iconI = document.createElement('i');
                        iconI.className = tier.tierIconClass; 
                        tierNameSpan.appendChild(iconI);
                        tierNameSpan.appendChild(document.createTextNode(" "));
                    }
                    tierNameSpan.appendChild(document.createTextNode(tier.tierName));
                    tierDiv.appendChild(tierNameSpan);
                    if (tier.specs) {
                        const specsP = document.createElement('p');
                        specsP.classList.add('tier-specs');
                        specsP.textContent = tier.specs;
                        tierDiv.appendChild(specsP);
                    }
                    const priceSpan = document.createElement('span');
                    priceSpan.classList.add('price-prediction');
                    priceSpan.textContent = tier.pricePrediction || 'N/A';
                    const infoIcon = document.createElement('i');
                    infoIcon.className = 'fas fa-info-circle'; 
                    infoIcon.title = tier.priceDetails ? 
                        `Prompt: ${tier.priceDetails.promptTokensPer1k || 'N/A'}, Completion: ${tier.priceDetails.completionTokensPer1k || 'N/A'} per ${tier.priceDetails.unit || 'unit'}` : 
                        (tier.priceDetails && tier.priceDetails.perHour ? `${tier.priceDetails.perHour}/${tier.priceDetails.unit}` : 'Price details unavailable');
                    if (tier.priceDetails) priceSpan.appendChild(infoIcon); 
                    tierDiv.appendChild(priceSpan);
                    providerInfoDiv.appendChild(tierDiv);
                });
            }
            const selectProviderBtn = document.createElement('button');
            selectProviderBtn.classList.add('select-provider-btn');
            selectProviderBtn.textContent = 'Use this Provider';
            providerCard.appendChild(logoImg);
            providerCard.appendChild(providerInfoDiv);
            providerCard.appendChild(selectProviderBtn);
            providerListContainer.appendChild(providerCard);
        });
    }

    if (sendMessageBtn) sendMessageBtn.addEventListener('click', handleSendMessage);
    if (messageInput) { 
        messageInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault(); 
                handleSendMessage();
            }
        });
        messageInput.addEventListener('input', () => {
            messageInput.style.height = 'auto';
            messageInput.style.height = (messageInput.scrollHeight) + 'px';
        });
    }
    if (configPanelBtn && configPanel) { 
        configPanelBtn.addEventListener('click', () => {
            configPanel.style.display = 'block';
            renderModelCards(mockModelsData); 
        });
    }
    if (closeConfigPanelBtnInside && configPanel) { 
        closeConfigPanelBtnInside.addEventListener('click', () => {
            configPanel.style.display = 'none';
            resetConfigPanelState(); 
        });
    }
    
    if (providerListContainer) { 
        providerListContainer.addEventListener('click', (event) => {
            const target = event.target;
            const selectBtn = target.closest('.select-provider-btn'); 
            let cardToSelect = null;
            let specificTierId = null;
            let specificTierName = '';
            let specificPrice = '';

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

                selectedProvider = { 
                    id: providerId, 
                    name: providerName,
                    tierId: specificTierId || providerId, 
                    tier: specificTierName || 'Default Tier',
                    price: specificPrice 
                };
                console.log('Selected Provider:', selectedProvider);
            }
        });
    }
    if (applyConfigBtn) { 
        applyConfigBtn.addEventListener('click', () => {
            if (selectedModel && selectedProvider) {
                if (activeConfigDisplay) {
                    activeConfigDisplay.textContent = `Model: ${selectedModel.name}, Provider: ${selectedProvider.name} (${selectedProvider.tier}) - ${selectedProvider.price}`;
                }
                if (configPanel) configPanel.style.display = 'none';
                console.log('Configuration Applied:', { model: selectedModel, provider: selectedProvider });
                resetConfigPanelState(); 
            } else {
                alert('Please select both a model and a provider/tier.');
            }
        });
    }
    if (modelSearchInput && modelListContainer) { 
        modelSearchInput.addEventListener('input', () => {
            const searchTerm = modelSearchInput.value.toLowerCase();
            const filteredModels = mockModelsData.filter(model => {
                const modelName = model.name.toLowerCase();
                const modelDescription = model.description.toLowerCase();
                return modelName.includes(searchTerm) || modelDescription.includes(searchTerm);
            });
            renderModelCards(filteredModels); 
        });
    }
});
