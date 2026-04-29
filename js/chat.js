// Chat Widget
let chatMessages = [];

// Toggle chat
function toggleChat() {
    const chatContainer = document.getElementById('chatContainer');
    chatContainer.classList.toggle('active');
    if (chatContainer.classList.contains('active')) {
        loadChatMessages();
    }
}

// Load chat messages from Supabase
async function loadChatMessages() {
    const messagesContainer = document.getElementById('chatMessages');
    if (!messagesContainer) return;
    
    try {
        const { data, error } = await supabase
            .from('chat_messages')
            .select('*')
            .order('created_at', { ascending: true })
            .limit(50);
        
        if (error) throw error;
        
        chatMessages = data || [];
        renderChatMessages();
    } catch (error) {
        console.error('Error loading chat:', error);
        // Load demo messages if no data
        if (chatMessages.length === 0) {
            chatMessages = [
                { id: 1, message: 'Welcome to SupremeAmer! How can we help you today?', is_support: true, created_at: new Date() },
                { id: 2, message: 'Feel free to ask any questions about our investment opportunities.', is_support: true, created_at: new Date() }
            ];
            renderChatMessages();
        }
    }
}

// Render chat messages
function renderChatMessages() {
    const messagesContainer = document.getElementById('chatMessages');
    if (!messagesContainer) return;
    
    messagesContainer.innerHTML = chatMessages.map(msg => `
        <div class="chat-message ${msg.is_support ? 'support' : 'user'}">
            ${msg.message}
            <div style="font-size: 0.7rem; margin-top: 5px; opacity: 0.7;">
                ${new Date(msg.created_at).toLocaleTimeString()}
            </div>
        </div>
    `).join('');
    
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Send chat message
async function sendChatMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    // Add user message
    const userMessage = {
        id: Date.now(),
        message: message,
        is_support: false,
        created_at: new Date()
    };
    
    chatMessages.push(userMessage);
    renderChatMessages();
    input.value = '';
    
    // Save to Supabase if logged in
    if (currentUser) {
        try {
            await supabase
                .from('chat_messages')
                .insert([
                    {
                        user_id: currentUser.id,
                        message: message,
                        is_support: false,
                        created_at: new Date().toISOString()
                    }
                ]);
        } catch (error) {
            console.error('Error saving message:', error);
        }
    }
    
    // Auto-reply after 1 second
    setTimeout(() => {
        const autoReply = {
            id: Date.now() + 1,
            message: 'Thank you for your message. A support agent will respond shortly. In the meantime, check out our FAQ or investment guides!',
            is_support: true,
            created_at: new Date()
        };
        chatMessages.push(autoReply);
        renderChatMessages();
        
        // Save auto-reply
        if (currentUser) {
            supabase.from('chat_messages').insert([
                {
                    user_id: null,
                    message: autoReply.message,
                    is_support: true,
                    created_at: new Date().toISOString()
                }
            ]).catch(console.error);
        }
    }, 1000);
}
