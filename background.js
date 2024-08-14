chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'enable' || request.action === 'disable') {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs[0] && tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, {action: request.action}, function(response) {
          if (chrome.runtime.lastError) {
            console.log("Error sending message:", chrome.runtime.lastError.message);
          }
        });
      }
    });
  }
});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  if (changeInfo.status === 'complete' && tab && tab.url && tab.url.includes('youtube.com')) {
    chrome.storage.sync.get('enabled', function(data) {
      if (data.enabled !== false) {
        chrome.tabs.sendMessage(tabId, {action: 'enable'}, function(response) {
          if (chrome.runtime.lastError) {
            console.log("Error sending message:", chrome.runtime.lastError.message);
          }
        });
      }
    });
  }
});