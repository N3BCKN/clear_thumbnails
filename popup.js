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
      sendMessageToActiveYouTubeTab({action: isEnabled ? 'enable' : 'disable'});
    });
  });

  refreshButton.addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs[0] && tabs[0].url.includes('youtube.com')) {
        chrome.tabs.reload(tabs[0].id);
      } else {
        updateStatus('Not on YouTube', 'warning');
      }
    });
  });

  bgColorPicker.addEventListener('change', function() {
    chrome.storage.sync.set({bgColor: bgColorPicker.value}, function() {
      sendMessageToActiveYouTubeTab({action: 'updateColors', bgColor: bgColorPicker.value});
    });
  });

  textColorPicker.addEventListener('change', function() {
    chrome.storage.sync.set({textColor: textColorPicker.value}, function() {
      sendMessageToActiveYouTubeTab({action: 'updateColors', textColor: textColorPicker.value});
    });
  });

  resetButton.addEventListener('click', function() {
    bgColorPicker.value = DEFAULT_BG_COLOR;
    textColorPicker.value = DEFAULT_TEXT_COLOR;
    
    chrome.storage.sync.set({
      bgColor: DEFAULT_BG_COLOR,
      textColor: DEFAULT_TEXT_COLOR
    }, function() {
      sendMessageToActiveYouTubeTab({
        action: 'updateColors',
        bgColor: DEFAULT_BG_COLOR,
        textColor: DEFAULT_TEXT_COLOR
      });
    });
  });

  function updateStatus(state, type = 'normal') {
    if (type === 'normal') {
      status.textContent = state ? 'On' : 'Off';
      status.style.color = state ? '#008000' : '#cc0000';
    } else if (type === 'warning') {
      status.textContent = state;
      status.style.color = '#ffa500';
    }
  }

  function sendMessageToActiveYouTubeTab(message) {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs[0] && tabs[0].url.includes('youtube.com')) {
        chrome.tabs.sendMessage(tabs[0].id, message, function(response) {
          if (chrome.runtime.lastError) {
            console.log("Error sending message:", chrome.runtime.lastError.message);
          }
        });
      } else {
        updateStatus('Not on YouTube', 'warning');
      }
    });
  }
});