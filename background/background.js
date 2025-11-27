chrome.runtime.onInstalled.addListener(() => {
  console.log('AccessAI installed!');
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background received:', request);
  sendResponse({ success: true });
});
