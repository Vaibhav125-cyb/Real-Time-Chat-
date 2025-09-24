
        // WebSocket Server Simulation (based on the provided server.js)
        class WebSocketServer {
            constructor() {
                this.clients = new Map();
                this.messageHistory = [];
                this.maxHistory = 100;
                this.clientIdCounter = 0;
                this.consoleElement = document.getElementById('server-console');
            }

            log(message, type = 'info') {
                const messageElement = document.createElement('div');
                messageElement.classList.add('server-message');
                if (type === 'error') {
                    messageElement.classList.add('server-error');
                } else if (type === 'status') {
                    messageElement.classList.add('server-status');
                }

                messageElement.textContent = message;
                this.consoleElement.appendChild(messageElement);
                this.consoleElement.scrollTop = this.consoleElement.scrollHeight;

                console.log(`[Server] ${message}`);
            }

            // Simulate a client connecting to the server
            connectClient(onMessageCallback) {
                const clientId = this.clientIdCounter++;
                this.clients.set(clientId, {
                    id: clientId,
                    send: onMessageCallback
                });

                this.log(`Client ${clientId} connected!`);

                // Send welcome message to new client
                onMessageCallback(JSON.stringify({
                    type: 'info',
                    message: 'Welcome to the chat!',
                    timestamp: Date.now()
                }));

                // Send message history to new client
                onMessageCallback(JSON.stringify({
                    type: 'history',
                    history: this.messageHistory
                }));

                return clientId;
            }

            // Simulate a client disconnecting from the server
            disconnectClient(clientId) {
                this.clients.delete(clientId);
                this.log(`Client ${clientId} has disconnected.`);
            }

            // Handle message from client
            handleMessage(clientId, data) {
                try {
                    const message = JSON.parse(data);
                    this.log(`Received from client ${clientId}: ${message.text}`);

                    // Add timestamp and client info
                    const fullMessage = {
                        ...message,
                        sender: 'User ' + clientId,
                        timestamp: Date.now(),
                        time: this.getCurrentTime()
                    };

                    // Add to history
                    this.messageHistory.push(fullMessage);
                    if (this.messageHistory.length > this.maxHistory) {
                        this.messageHistory.shift();
                    }

                    // Broadcast to all clients (simulating the broadcast function from server.js)
                    this.broadcast(JSON.stringify(fullMessage));

                } catch (error) {
                    this.log(`Error processing message: ${error}`, 'error');
                    console.error('Error processing message:', error);
                }
            }

            // Broadcast message to all clients (simulating the broadcast function from server.js)
            broadcast(message) {
                this.clients.forEach(client => {
                    if (client && client.send) {
                        client.send(message);
                    }
                });
            }

            // Function to get current time in HH:MM AM/PM format
            getCurrentTime() {
                const now = new Date();
                let hours = now.getHours();
                let minutes = now.getMinutes();
                const ampm = hours >= 12 ? 'PM' : 'AM';

                hours = hours % 12;
                hours = hours ? hours : 12;
                minutes = minutes < 10 ? '0' + minutes : minutes;

                return `${hours}:${minutes} ${ampm}`;
            }
        }

        // Frontend Application
        document.addEventListener('DOMContentLoaded', function () {
            const chatMessages = document.getElementById('chat-messages');
            const messageInput = document.getElementById('message-input');
            const sendButton = document.getElementById('send-button');
            const statusIndicator = document.getElementById('status-indicator');
            const statusText = document.getElementById('status-text');
            const typingIndicator = document.getElementById('typing-indicator');

            // Create WebSocket server simulation
            const server = new WebSocketServer();
            let clientId = null;
            let connectionStatus = 'connected';

            // Connect to WebSocket server simulation
            clientId = server.connectClient(function (message) {
                handleServerMessage(message);
            });

            // Load sample message history
            loadMessageHistory();

            // Function to load message history
            function loadMessageHistory() {
                // In a real app, this would come from a server/database
                const sampleMessages = [
                    { sender: 'System', text: 'Welcome to the chat application!', time: '10:00 AM', type: 'info' },
                    { sender: 'User 1', text: 'Hey there! How are you?', time: '10:30 AM', type: 'incoming' },
                    { sender: 'You', text: 'I\'m doing great! Thanks for asking.', time: '10:32 AM', type: 'outgoing' },
                    { sender: 'User 2', text: 'This is a cool chat app!', time: '10:33 AM', type: 'incoming' }
                ];

                // Display message history
                sampleMessages.forEach(message => {
                    addMessageToChat(message);
                });
            }

            // Function to add a message to the chat
            function addMessageToChat(message) {
                const messageElement = document.createElement('div');

                if (message.type === 'info') {
                    messageElement.innerHTML = `
                        <div style="text-align: center; color: #666; font-style: italic;">
                            ${message.text}
                        </div>
                    `;
                    messageElement.style.margin = '10px 0';
                } else {
                    messageElement.classList.add('message', `message-${message.type}`);

                    let messageHTML = '';
                    if (message.type === 'incoming') {
                        messageHTML += `<div class="message-sender">${message.sender}</div>`;
                    }

                    messageHTML += `<div class="message-text">${message.text}</div>`;
                    messageHTML += `<div class="message-time">${message.time}</div>`;

                    messageElement.innerHTML = messageHTML;
                }

                chatMessages.appendChild(messageElement);

                // Scroll to bottom
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }

            // Function to handle messages from the server
            function handleServerMessage(data) {
                const message = JSON.parse(data);

                switch (message.type) {
                    case 'message':
                        addMessageToChat({
                            ...message,
                            type: message.sender === 'You' ? 'outgoing' : 'incoming'
                        });
                        break;
                    case 'info':
                        addMessageToChat({
                            type: 'info',
                            text: message.message,
                            time: server.getCurrentTime()
                        });
                        break;
                    case 'history':
                        // Load message history
                        message.history.forEach(msg => {
                            addMessageToChat({
                                ...msg,
                                type: msg.sender === 'You' ? 'outgoing' : 'incoming'
                            });
                        });
                        break;
                }
            }

            // Function to send a message
            function sendMessage() {
                const messageText = messageInput.value.trim();

                if (messageText === '') return;

                // Create message object
                const message = {
                    type: 'message',
                    text: messageText
                };

                // Send via WebSocket simulation
                server.handleMessage(clientId, JSON.stringify(message));

                // Add to chat immediately for better UX
                addMessageToChat({
                    sender: 'You',
                    text: messageText,
                    time: server.getCurrentTime(),
                    type: 'outgoing'
                });

                // Clear input
                messageInput.value = '';
            }

            // Event listeners
            sendButton.addEventListener('click', sendMessage);

            messageInput.addEventListener('keypress', function (e) {
                if (e.key === 'Enter') {
                    sendMessage();
                }
            });

            // Simulate connection status changes
            setInterval(() => {
                if (Math.random() > 0.95) {
                    if (connectionStatus === 'connected') {
                        connectionStatus = 'disconnected';
                        statusIndicator.classList.remove('connected');
                        statusIndicator.classList.add('disconnected');
                        statusText.textContent = 'Disconnected';
                        server.log(`Client ${clientId} connection lost`, 'error');
                    } else {
                        connectionStatus = 'connected';
                        statusIndicator.classList.remove('disconnected');
                        statusIndicator.classList.add('connected');
                        statusText.textContent = 'Connected';
                        server.log(`Client ${clientId} reconnected`, 'status');
                    }
                }
            }, 5000);

            // Simulate other users sending messages
            setInterval(() => {
                if (Math.random() > 0.7 && connectionStatus === 'connected') {
                    const messages = [
                        "Hello there!",
                        "How's it going?",
                        "This chat app is working well!",
                        "What do you think about WebSockets?",
                        "Have you tried building real-time apps before?"
                    ];

                    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
                    const randomUserId = Math.floor(Math.random() * 5) + 1;

                    // Simulate receiving a message from another user
                    server.broadcast(JSON.stringify({
                        type: 'message',
                        sender: 'User ' + randomUserId,
                        text: randomMessage,
                        timestamp: Date.now(),
                        time: server.getCurrentTime()
                    }));
                }
            }, 10000);
        });
  