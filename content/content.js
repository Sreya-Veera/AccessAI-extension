console.log('🌐 AccessAI loaded');

let activeMode = null;
const descriptionCache = new Map();
let currentFloatingButton = null;

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
  removeFloatingButton();
  document.body.classList.remove('accessai-vision', 'accessai-cognitive', 'accessai-motor');
  
  // Remove all click listeners
  document.querySelectorAll('.accessai-needs-description').forEach(img => {
    img.classList.remove('accessai-needs-description');
    img.style.outline = '';
  });
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
    
    // Force red outline with inline style (override any site CSS)
    img.style.outline = '3px dashed #ff6b6b';
    img.style.outlineOffset = '2px';
    img.style.cursor = 'help';
    
    // Add click handler
    img.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      showFloatingButton(img, index);
    });
  });
}

function showFloatingButton(img, index) {
  // Remove any existing button
  removeFloatingButton();
  
  const rect = img.getBoundingClientRect();
  
  const button = document.createElement('div');
  button.id = 'accessai-floating-button';
  button.className = 'accessai-floating-button';
  button.innerHTML = `
    <button class="accessai-describe-btn" data-index="${index}">
      ✨ Describe This Image
    </button>
  `;
  
  document.body.appendChild(button);
  
  // Position it
  button.style.position = 'fixed';
  button.style.top = `${rect.top + 10}px`;
  button.style.left = `${rect.left + 10}px`;
  button.style.zIndex = '999999';
  
  currentFloatingButton = button;
  
  // Add click handler
  button.querySelector('.accessai-describe-btn').addEventListener('click', async (e) => {
    e.stopPropagation();
    await describeImage(img, index);
  });
  
  // Remove on click outside
  setTimeout(() => {
    document.addEventListener('click', removeFloatingButton, { once: true });
  }, 100);
}

function removeFloatingButton() {
  if (currentFloatingButton) {
    currentFloatingButton.remove();
    currentFloatingButton = null;
  }
}

async function describeImage(img, index) {
  const cacheKey = img.src;
  
  // Check cache first
  if (descriptionCache.has(cacheKey)) {
    showTooltip(img, descriptionCache.get(cacheKey));
    removeFloatingButton();
    return;
  }
  
  // Show loading
  const btn = document.querySelector(`[data-index="${index}"]`);
  if (!btn) return;
  
  const originalText = btn.innerHTML;
  btn.innerHTML = '⏳ Analyzing...';
  btn.disabled = true;
  
  try {
    // Call Hugging Face API
    const description = await getImageDescription(img.src);
    
    // Cache it
    descriptionCache.set(cacheKey, description);
    
    // Show tooltip
    showTooltip(img, description);
    
    // Remove button
    removeFloatingButton();
    
  } catch (error) {
    console.error('Error describing image:', error);
    btn.innerHTML = '❌ Error - Try Again';
    setTimeout(() => {
      btn.innerHTML = originalText;
      btn.disabled = false;
    }, 2000);
  }
}

async function getImageDescription(imageUrl) {
  try {
    const response = await fetch('https://api-inference.huggingface.co/models/Salesforce/blip-image-captioning-base', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: imageUrl
      })
    });
    
    if (!response.ok) {
      throw new Error('API request failed');
    }
    
    const result = await response.json();
    
    if (result && result[0] && result[0].generated_text) {
      return result[0].generated_text;
    }
    
    return 'Image description unavailable';
    
  } catch (error) {
    console.error('Hugging Face API error:', error);
    return 'An image on this webpage (AI description temporarily unavailable)';
  }
}

function showTooltip(img, description) {
  // Remove any existing tooltip
  document.querySelectorAll('.accessai-tooltip').forEach(el => el.remove());
  
  const tooltip = document.createElement('div');
  tooltip.className = 'accessai-tooltip';
  tooltip.innerHTML = `
    <div class="accessai-tooltip-content">
      <strong>✨ AI Description:</strong>
      <p>${description}</p>
      <button class="accessai-tooltip-close">×</button>
    </div>
  `;
  
  document.body.appendChild(tooltip);
  
  // Position near the image
  const rect = img.getBoundingClientRect();
  tooltip.style.position = 'fixed';
  tooltip.style.top = `${Math.min(rect.bottom + 10, window.innerHeight - 150)}px`;
  tooltip.style.left = `${rect.left}px`;
  tooltip.style.maxWidth = `${Math.min(rect.width, 400)}px`;
  tooltip.style.zIndex = '999999';
  
  // Close button
  tooltip.querySelector('.accessai-tooltip-close').addEventListener('click', () => {
    tooltip.remove();
  });
  
  // Auto-close after 10 seconds
  setTimeout(() => {
    if (tooltip.parentNode) tooltip.remove();
  }, 10000);
}

function activateCognitiveMode() {
  document.body.classList.add('accessai-cognitive');
  console.log('Cognitive mode activated');
}

function activateMotorMode() {
  document.body.classList.add('accessai-motor');
  console.log('Motor mode activated');
}
