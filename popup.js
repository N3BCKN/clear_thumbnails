document.addEventListener('DOMContentLoaded', function() {
  var toggleSwitch = document.getElementById('toggleSwitch');
  var status = document.getElementById('status');
  var refreshButton = document.getElementById('refreshButton');

  // fetch current state from chrome.storage
  chrome.storage.sync.get('enabled', function(data) {
    toggleSwitch.checked = data.enabled !== false;
    updateStatus(toggleSwitch.checked);
  });

  toggleSwitch.addEventListener('change', function() {
    var isEnabled = toggleSwitch.checked;
    // Save current state
    chrome.storage.sync.set({enabled: isEnabled}, function() {
      updateStatus(isEnabled);
      // send message to background script
      chrome.runtime.sendMessage({action: isEnabled ? 'enable' : 'disable'}, function(response) {
        if (chrome.runtime.lastError) {
          console.log("Error sending message:", chrome.runtime.lastError.message);
        }
      });
    });
  });

  refreshButton.addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs[0] && tabs[0].id) {
        chrome.tabs.reload(tabs[0].id);
      }
    });
  });

  function updateStatus(isEnabled) {
    status.textContent = isEnabled ? 'On ' : 'Off';
    status.style.color = isEnabled ? '#008000' : '#cc0000';
  }
});