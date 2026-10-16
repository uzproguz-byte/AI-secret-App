const status = document.getElementById('status');

chrome.windows.create({
  url: chrome.runtime.getURL('share.html'),
  type: 'normal',
  width: 560,
  height: 820,
  focused: true
}, () => {
  if (chrome.runtime.lastError) {
    status.textContent = chrome.runtime.lastError.message;
    return;
  }
  window.close();
});
