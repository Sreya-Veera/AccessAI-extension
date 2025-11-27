chrome.storage.local.get(['activeMode'], (result) => {
  if (result.activeMode) {
    document.getElementById(`${result.activeMode}Mode`).classList.add('active');
    document.getElementById('statusText').textContent = `${capitalize(result.activeMode)} mode active`;
  }
});

document.querySelectorAll('.mode-btn').forEach(btn => {
  btn.addEventListener('click', async () => {
    const mode = btn.dataset.mode;
    
    document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
    
    const isActive = btn.classList.contains('active');
    if (!isActive) {
      btn.classList.add('active');
      
      await chrome.storage.local.set({ activeMode: mode });
      
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, { 
          action: 'activateMode', 
          mode: mode 
        });
      });
      
      document.getElementById('statusText').textContent = `${capitalize(mode)} mode activated!`;
    } else {
      await chrome.storage.local.remove('activeMode');
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'deactivateMode' });
      });
      document.getElementById('statusText').textContent = 'All modes disabled';
    }
  });
});

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
