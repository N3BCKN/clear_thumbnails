const DEFAULT_BG_COLOR = '#d3d3d3';
const DEFAULT_TEXT_COLOR = '#000080';

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.storage.sync.set({ 
      enabled: true,
      bgColor: DEFAULT_BG_COLOR,
      textColor: DEFAULT_TEXT_COLOR
    }, () => {
      console.log('Extension installed and enabled by default');
    });
  } else {
    chrome.storage.sync.get(['bgColor', 'textColor'], (result) => {
      if (!result.bgColor) {
        chrome.storage.sync.set({bgColor: DEFAULT_BG_COLOR});
      }
      if (!result.textColor) {
        chrome.storage.sync.set({textColor: DEFAULT_TEXT_COLOR});
      }
    });
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getColors') {
    chrome.storage.sync.get(['bgColor', 'textColor'], (result) => {
      sendResponse({
        bgColor: result.bgColor || DEFAULT_BG_COLOR,
        textColor: result.textColor || DEFAULT_TEXT_COLOR
      });
    });
    return true; // Indicates that the response is sent asynchronously
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab && tab.url && tab.url.includes('youtube.com')) {
    chrome.storage.sync.get(['enabled', 'bgColor', 'textColor'], (result) => {
      if (result.enabled !== false) {
        chrome.tabs.sendMessage(tabId, {
          action: 'updateColors',
          bgColor: result.bgColor || DEFAULT_BG_COLOR,
          textColor: result.textColor || DEFAULT_TEXT_COLOR
        }, (response) => {
          if (chrome.runtime.lastError) {
            console.log('Error sending message:', chrome.runtime.lastError.message);
          }
        });
      }
    });
  }
});