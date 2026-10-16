const status = document.getElementById('status');

chrome.windows.create({
  url: chrome.runtime.getURL('share.html'),
  type: 'normal',
  width: 360,
  height: 500,
  focused: true
}, () => {
  if (chrome.runtime.lastError) {
    status.textContent = chrome.runtime.lastError.message;
    return;
  }
  window.close();
});
