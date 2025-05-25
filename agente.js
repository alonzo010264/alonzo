document.addEventListener('DOMContentLoaded', () => {
    const toggleAgentStatusButton = document.getElementById('toggleAgentStatusButton');
    const waitingListUl = document.getElementById('waitingList');
    const agentChatBox = document.getElementById('agentChatBox');
    const agentMessageInput = document.getElementById('agentMessageInput');
    const agentSendMessageButton = document.getElementById('agentSendMessageButton');
    const agentAttachFileButton = document.getElementById('agentAttachFileButton');
    const agentFileInput = document.getElementById('agentFileInput');
    const agentChatInputContainer = document.getElementById('agentChatInputContainer');
    const currentChatWithSpan = document.querySelector('#currentChatWith span');
    const selectChatMessageP = document.getElementById('selectChatMessage');


    const AGENT_ID_KEY = 'expressboxrd_chat_agent_id'; // Para este agente
    const AGENT_STATUS_KEY = 'expressboxrd_chat_agent_status';
    const WAITING_QUEUE_KEY = 'expressboxrd_chat_waiting_queue';
    const CHAT_MESSAGES_KEY_PREFIX = 'expressboxrd_chat_messages_';
    const ACTIVE_CHAT_AGENT_KEY = 'expressboxrd_chat_active_agent_'; // + clientId

    let agentId = localStorage.getItem(AGENT_ID_KEY);
    if (!agentId) {
        agentId = 'agent_' + Date.now() + Math.random().toString(16).slice(2);
        localStorage.setItem(AGENT_ID_KEY, agentId);
    }
    let isAgentOnline = localStorage.getItem(AGENT_STATUS_KEY) === 'online';
    let currentClientChattingId = null;

    const getFromStorage = (key) => JSON.parse(localStorage.getItem(key) || '[]');
    const saveToStorage = (key, data) => localStorage.setItem(key, JSON.stringify(data));

    function updateAgentStatusButton() {
        if (!toggleAgentStatusButton) return;
        if (isAgentOnline) {
            toggleAgentStatusButton.textContent = 'Desconectarse';
            toggleAgentStatusButton.classList.add('connected');
            localStorage.setItem(AGENT_STATUS_KEY, 'online');
        } else {
            toggleAgentStatusButton.textContent = 'Conectarse';
            toggleAgentStatusButton.classList.remove('connected');
            localStorage.setItem(AGENT_STATUS_KEY, 'offline');
        }
        // Notificar a otras pestañas (el cliente escuchará esto)
        localStorage.setItem(AGENT_STATUS_KEY, isAgentOnline ? 'online' : 'offline');
    }

    function renderWaitingList() {
        if (!waitingListUl) return;
        const queue = getFromStorage(WAITING_QUEUE_KEY);
        waitingListUl.innerHTML = '';
        if (queue.length === 0) {
            waitingListUl.innerHTML = '<li class="no-waiting">No hay clientes en espera.</li>';
            return;
        }
        queue.forEach(client => {
            const li = document.createElement('li');
            li.dataset.clientId = client.id;
            li.textContent = `${client.name || 'Cliente Desconocido'} (ID: ...${client.id.slice(-4)})`;
            // Marcar si este agente ya está chateando con este cliente
            if (localStorage.getItem(ACTIVE_CHAT_AGENT_KEY + client.id) === agentId) {
                li.classList.add('active-chat');
            }
            // TODO: Marcar si tiene mensajes nuevos no leídos por ESTE agente
            waitingListUl.appendChild(li);
        });
    }

    function displayAgentMessage(sender, text, isClient = false) {
        if (!agentChatBox) return;
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', isClient ? 'received' : 'sent'); // Invertido para el agente
        // ... (resto de la lógica de displayMessage, adaptando el nombre del remitente)
        const senderName = document.createElement('span');
        senderName.classList.add('sender-name');
        senderName.textContent = isClient ? `Cliente (...${currentClientChattingId.slice(-4)})` : 'Tú (Agente)';
        messageDiv.appendChild(senderName);

        const messageText = document.createElement('p');
        messageText.textContent = text;
        messageDiv.appendChild(messageText);

        const timestamp = document.createElement('span');
        timestamp.classList.add('timestamp');
        timestamp.textContent = new Date().toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' });
        messageDiv.appendChild(timestamp);

        agentChatBox.appendChild(messageDiv);
        agentChatBox.scrollTop = agentChatBox.scrollHeight;
    }

    function saveAgentMessage(sender, text, isClient = false) {
        if (!currentClientChattingId) return;
        const messagesKey = CHAT_MESSAGES_KEY_PREFIX + currentClientChattingId;
        const messages = JSON.parse(localStorage.getItem(messagesKey) || '[]');
        messages.push({ sender, text, timestamp: new Date().toISOString(), isAgent: !isClient }); // isAgent es true si el agente envía
        localStorage.setItem(messagesKey, JSON.stringify(messages));
    }

    function loadAgentChatMessages(clientId) {
        if (!agentChatBox) return;
        currentClientChattingId = clientId;
        agentChatBox.innerHTML = ''; // Limpiar chat anterior
        const messagesKey = CHAT_MESSAGES_KEY_PREFIX + clientId;
        const messages = JSON.parse(localStorage.getItem(messagesKey) || '[]');
        messages.forEach(msg => displayAgentMessage(msg.sender, msg.text, msg.isAgent === false)); // isAgent false significa que el cliente lo envió
        // Marcar como "leído" (simulación)
        const waitingLi = waitingListUl.querySelector(`li[data-client-id="${clientId}"]`);
        if (waitingLi) waitingLi.classList.remove('has-new-message');

        // Mostrar UI de chat
        if(agentChatBox) agentChatBox.style.display = 'flex';
        if(agentChatInputContainer) agentChatInputContainer.style.display = 'flex';
        if(currentChatWithSpan) currentChatWithSpan.parentElement.style.display = 'block';
        if(currentChatWithSpan) currentChatWithSpan.textContent = `...${clientId.slice(-4)}`;
        if(selectChatMessageP) selectChatMessageP.style.display = 'none';
    }

    // --- Event Listeners Agente ---
    if (toggleAgentStatusButton) {
        toggleAgentStatusButton.addEventListener('click', () => {
            isAgentOnline = !isAgentOnline;
            updateAgentStatusButton();
            if (!isAgentOnline && currentClientChattingId) {
                // Notificar al cliente que el agente se desconectó (opcional)
                // localStorage.removeItem(ACTIVE_CHAT_AGENT_KEY + currentClientChattingId);
            }
        });
    }

    if (waitingListUl) {
        waitingListUl.addEventListener('click', (event) => {
            const li = event.target.closest('li');
            if (li && li.dataset.clientId && !li.classList.contains('no-waiting')) {
                const clientId = li.dataset.clientId;
                // Antes de cargar, asegurarse que este agente "toma" el chat
                // y libera cualquier otro chat que este agente tuviera activo.
                const queue = getFromStorage(WAITING_QUEUE_KEY);
                const clientInQueue = queue.find(c => c.id === clientId);

                if (clientInQueue) {
                    // Marcar este chat como activo para este agente
                    localStorage.setItem(ACTIVE_CHAT_AGENT_KEY + clientId, agentId);

                    // Quitar al cliente de la cola de espera general
                    const updatedQueue = queue.filter(c => c.id !== clientId);
                    saveToStorage(WAITING_QUEUE_KEY, updatedQueue);
                    renderWaitingList(); // Actualizar la lista de espera

                    // Cargar mensajes del chat seleccionado
                    loadAgentChatMessages(clientId);

                    // Marcar el LI como activo en la UI del agente
                    waitingListUl.querySelectorAll('li').forEach(item => item.classList.remove('active-chat'));
                    li.classList.add('active-chat');
                }
            }
        });
    }

    if (agentSendMessageButton && agentMessageInput) {
        agentSendMessageButton.addEventListener('click', () => {
            const messageText = agentMessageInput.value.trim();
            if (messageText && currentClientChattingId) {
                displayAgentMessage(agentId, messageText, false); // Agente envía (isClient = false)
                saveAgentMessage(agentId, messageText, false);
                // Notificar al cliente (disparar evento storage)
                localStorage.setItem('expressboxrd_chat_agent_sent_' + currentClientChattingId, JSON.stringify({ text: messageText, timestamp: Date.now() }));
                agentMessageInput.value = '';
                agentMessageInput.style.height = 'auto';
            }
        });
        agentMessageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                agentSendMessageButton.click();
            }
        });
         agentMessageInput.addEventListener('input', () => {
            agentMessageInput.style.height = 'auto';
            agentMessageInput.style.height = (agentMessageInput.scrollHeight) + 'px';
        });
    }

    if (agentAttachFileButton && agentFileInput) {
        agentAttachFileButton.addEventListener('click', () => agentFileInput.click());
        agentFileInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file && currentClientChattingId) {
                const simulatedText = `(Simulación: Agente adjuntó '${file.name}')`;
                displayAgentMessage(agentId, simulatedText, false);
                saveAgentMessage(agentId, simulatedText, false);
                localStorage.setItem('expressboxrd_chat_agent_sent_' + currentClientChattingId, JSON.stringify({ text: simulatedText, type: 'file_sim', fileName: file.name, timestamp: Date.now() }));
                agentFileInput.value = '';
            }
        });
    }

    // Escuchar cambios en localStorage para mensajes de clientes y cola
    window.addEventListener('storage', (event) => {
        if (event.key && event.key.startsWith('expressboxrd_chat_client_sent_') && event.newValue) {
            const clientIdFromKey = event.key.split('_').pop();
            if (clientIdFromKey === currentClientChattingId) { // Si es el chat activo
                try {
                    const clientMsgData = JSON.parse(event.newValue);
                    displayAgentMessage(clientIdFromKey, clientMsgData.text, true); // Cliente envía (isClient = true)
                    saveAgentMessage(clientIdFromKey, clientMsgData.text, true);
                } catch (e) { console.error("Error parseando mensaje del cliente:", e); }
            } else {
                // Marcar en la lista de espera que hay nuevo mensaje
                const waitingLi = waitingListUl.querySelector(`li[data-client-id="${clientIdFromKey}"]`);
                if (waitingLi) waitingLi.classList.add('has-new-message');
            }
        } else if (event.key === WAITING_QUEUE_KEY) {
            renderWaitingList(); // Actualizar la lista de espera si cambia
        }
    });


    // --- Inicialización Agente ---
    updateAgentStatusButton();
    renderWaitingList();
    // Cargar chat activo si el agente recarga la página y ya tenía uno
    // (Esto es más complejo, por ahora se enfoca en tomar de la lista)
});