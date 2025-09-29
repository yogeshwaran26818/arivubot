(function() {
  const CHATBOT_API_URL = 'https://arivubot-seven.vercel.app';
  
  const chatbotHTML = `
    <div id="chatbot-widget" style="position: fixed; bottom: 20px; right: 20px; z-index: 10000; font-family: Arial, sans-serif;">
      <div id="chatbot-button" style="width: 60px; height: 60px; background: #007bff; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.3);">
        <svg width="24" height="24" fill="white" viewBox="0 0 24 24">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
        </svg>
      </div>
      
      <div id="chatbot-window" style="display: none; width: 350px; height: 500px; background: white; border-radius: 10px; box-shadow: 0 8px 25px rgba(0,0,0,0.3); position: absolute; bottom: 70px; right: 0; flex-direction: column;">
        <div style="background: #007bff; color: white; padding: 15px; border-radius: 10px 10px 0 0; font-weight: bold;">
          Chat Support
          <span id="chatbot-close" style="float: right; cursor: pointer; font-size: 18px;">&times;</span>
        </div>
        
        <div id="chatbot-messages" style="flex: 1; padding: 15px; overflow-y: auto; max-height: 350px;">
          <div style="background: #f1f1f1; padding: 10px; border-radius: 10px; margin-bottom: 10px;">
            Hi! I'm here to help. What would you like to know?
          </div>
        </div>
        
        <div style="padding: 15px; border-top: 1px solid #eee;">
          <div style="display: flex; gap: 10px;">
            <input id="chatbot-input" type="text" placeholder="Type your message..." style="flex: 1; padding: 10px; border: 1px solid #ddd; border-radius: 20px; outline: none;">
            <button id="chatbot-send" style="background: #007bff; color: white; border: none; padding: 10px 15px; border-radius: 20px; cursor: pointer;">Send</button>
          </div>
        </div>
      </div>
    </div>
  `;

  function initChatbot() {
    document.body.insertAdjacentHTML('beforeend', chatbotHTML);
    
    const button = document.getElementById('chatbot-button');
    const chatWindow = document.getElementById('chatbot-window');
    const close = document.getElementById('chatbot-close');
    const input = document.getElementById('chatbot-input');
    const send = document.getElementById('chatbot-send');
    const messages = document.getElementById('chatbot-messages');
    
    const websiteId = window.location.origin;
    
    button.addEventListener('click', () => {
      chatWindow.style.display = chatWindow.style.display === 'none' ? 'flex' : 'none';
    });
    
    close.addEventListener('click', () => {
      chatWindow.style.display = 'none';
    });
    
    async function sendMessage() {
      const message = input.value.trim();
      if (!message) return;
      
      addMessage(message, 'user');
      input.value = '';
      
      const loadingId = addMessage('Typing...', 'bot', true);
      
      try {
        const response = await fetch(`${CHATBOT_API_URL}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            query: message, 
            websiteId: websiteId 
          })
        });
        
        const data = await response.json();
        
        document.getElementById(loadingId).remove();
        
        if (data.response) {
          addMessage(data.response, 'bot');
        } else {
          addMessage('Sorry, I couldn\'t process your request.', 'bot');
        }
      } catch (error) {
        document.getElementById(loadingId).remove();
        addMessage('Sorry, there was an error. Please try again.', 'bot');
      }
    }
    
    function addMessage(text, sender, isLoading = false) {
      const messageId = 'msg-' + Date.now();
      const isUser = sender === 'user';
      const messageHTML = `
        <div id="${messageId}" style="margin-bottom: 10px; text-align: ${isUser ? 'right' : 'left'};">
          <div style="display: inline-block; max-width: 80%; padding: 10px; border-radius: 10px; background: ${isUser ? '#007bff' : '#f1f1f1'}; color: ${isUser ? 'white' : 'black'};">
            ${text}
          </div>
        </div>
      `;
      messages.insertAdjacentHTML('beforeend', messageHTML);
      messages.scrollTop = messages.scrollHeight;
      return messageId;
    }
    
    send.addEventListener('click', sendMessage);
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendMessage();
    });
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initChatbot);
  } else {
    initChatbot();
  }
})();