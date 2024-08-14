document.addEventListener('DOMContentLoaded', function() {
  var toggleSwitch = document.getElementById('toggleSwitch');
  var status = document.getElementById('status');
  var refreshButton = document.getElementById('refreshButton');
  var bgColorPicker = document.getElementById('bgColor');
  var textColorPicker = document.getElementById('textColor');
  var resetButton = document.getElementById('resetButton');

  const DEFAULT_BG_COLOR = '#d3d3d3';
  const DEFAULT_TEXT_COLOR = '#000080';

  // Load current state and colors from chrome.storage
  chrome.storage.sync.get(['enabled', 'bgColor', 'textColor'], function(data) {
    toggleSwitch.checked = data.enabled !== false;
    updateStatus(toggleSwitch.checked);
    
    bgColorPicker.value = data.bgColor || DEFAULT_BG_COLOR;
    textColorPicker.value = data.textColor || DEFAULT_TEXT_COLOR;
  });

  toggleSwitch.addEventListener('change', function() {
    var isEnabled = toggleSwitch.checked;
    chrome.storage.sync.set({enabled: isEnabled}, function() {
      updateStatus(isEnabled);
      sendMessageToContentScript({action: isEnabled ? 'enable' : 'disable'});
    });
  });

  refreshButton.addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs[0] && tabs[0].id) {
        chrome.tabs.reload(tabs[0].id);
      }
    });
  });

  bgColorPicker.addEventListener('change', function() {
    chrome.storage.sync.set({bgColor: bgColorPicker.value}, function() {
      sendMessageToContentScript({action: 'updateColors', bgColor: bgColorPicker.value});
    });
  });

  textColorPicker.addEventListener('change', function() {
    chrome.storage.sync.set({textColor: textColorPicker.value}, function() {
      sendMessageToContentScript({action: 'updateColors', textColor: textColorPicker.value});
    });
  });

  resetButton.addEventListener('click', function() {
    bgColorPicker.value = DEFAULT_BG_COLOR;
    textColorPicker.value = DEFAULT_TEXT_COLOR;
    
    chrome.storage.sync.set({
      bgColor: DEFAULT_BG_COLOR,
      textColor: DEFAULT_TEXT_COLOR
    }, function() {
      sendMessageToContentScript({
        action: 'updateColors',
        bgColor: DEFAULT_BG_COLOR,
        textColor: DEFAULT_TEXT_COLOR
      });
    });
  });

  function updateStatus(isEnabled) {
    status.textContent = isEnabled ? 'On' : 'Off';
    status.style.color = isEnabled ? '#008000' : '#cc0000';
  }

  function sendMessageToContentScript(message) {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs[0] && tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, message, function(response) {
          if (chrome.runtime.lastError) {
            console.log("Error sending message:", chrome.runtime.lastError.message);
            // Handle the error (e.g., show a message to the user)
            status.textContent = "Error: YouTube page not found";
            status.style.color = '#cc0000';
          } else if (response && response.status === "Message received") {
            console.log("Message successfully sent to content script");
          }
        });
      } else {
        console.log("No active tab found");
        // Handle the error (e.g., show a message to the user)
        status.textContent = "Error: No active tab";
        status.style.color = '#cc0000';
      }
    });
  }
});