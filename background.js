chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'checkCartForBadIngredients') {
    console.log('sending message to content script');
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'checkCartForBadIngredients' }, function(response) {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError.message);
          sendResponse({ error: chrome.runtime.lastError.message });
          return;
        }
        console.log('response is ', response);
        sendResponse(response);
      });
    });
    return true;  // Keep the message port open for asynchronous response
  }
});
