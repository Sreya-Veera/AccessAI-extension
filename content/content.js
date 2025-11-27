console.log('🌐 AccessAI loaded');

let activeMode = null;

chrome.storage.local.get(['activeMode'], (result) => {
  if (result.activeMode) {
    activateMode(result.activeMode);
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'activateMode') {
    activateMode(request.mode);
  } else if (request.action === 'deactivateMode') {
    deactivateMode();
  }
});

function activateMode(mode) {
  activeMode = mode;
  console.log(`Activating ${mode} mode`);
  
  removeOverlay();
  createOverlay(mode);
  
  switch(mode) {
    case 'vision':
      activateVisionMode();
      break;
    case 'cognitive':
      activateCognitiveMode();
      break;
    case 'motor':
      activateMotorMode();
      break;
  }
}

function deactivateMode() {
  console.log('Deactivating all modes');
  activeMode = null;
  removeOverlay();
  document.body.classList.remove('accessai-vision', 'accessai-cognitive', 'accessai-motor');
}

function createOverlay(mode) {
  const overlay = document.createElement('div');
  overlay.id = 'accessai-overlay';
  overlay.className = 'accessai-overlay';
  overlay.innerHTML = `
    <div class="accessai-badge">
      <span class="accessai-icon">${getModeIcon(mode)}</span>
      <span class="accessai-label">${mode} mode</span>
      <button class="accessai-close">✕</button>
    </div>
  `;
  
  document.body.appendChild(overlay);
  
  overlay.querySelector('.accessai-close').addEventListener('click', () => {
    chrome.storage.local.remove('activeMode');
    deactivateMode();
  });
}

function removeOverlay() {
  const overlay = document.getElementById('accessai-overlay');
  if (overlay) overlay.remove();
}

function getModeIcon(mode) {
  const icons = {
    vision: '👁️',
    cognitive: '🧠',
    motor: '⌨️'
  };
  return icons[mode] || '🌐';
}

function activateVisionMode() {
  document.body.classList.add('accessai-vision');
  
  const images = document.querySelectorAll('img:not([alt]), img[alt=""]');
  console.log(`Found ${images.length} images without alt text`);
  
  images.forEach((img, index) => {
    img.classList.add('accessai-needs-description');
    img.dataset.accessaiIndex = index;
  });
}

function activateCognitiveMode() {
  document.body.classList.add('accessai-cognitive');
  console.log('Cognitive mode activated');
}

function activateMotorMode() {
  document.body.classList.add('accessai-motor');
  console.log('Motor mode activated');
}
