const openButton = document.getElementById('open');
const status = document.getElementById('status');

openButton.addEventListener('click', () => {
  openButton.disabled = true;
  status.textContent = 'Opening assistant…';
  chrome.windows.create({
    url: chrome.runtime.getURL('share.html'),
    type: 'popup',
    width: 390,
    height: 640,
    focused: true
  }, (win) => {
    if (chrome.runtime.lastError) {
      status.textContent = chrome.runtime.lastError.message;
      openButton.disabled = false;
      return;
    }
    window.close();
  });
});