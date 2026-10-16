const API_URL = 'https://ai-secret-app-production.up.railway.app/api/analyze';

const preview = document.getElementById('preview');
const placeholder = document.getElementById('placeholder');
const shareButton = document.getElementById('share');
const analyzeButton = document.getElementById('analyze');
const stopButton = document.getElementById('stop');
const autoCheckbox = document.getElementById('auto');
const answerElement = document.getElementById('answer');
const statusElement = document.getElementById('status');
const liveBadge = document.getElementById('liveBadge');
const durationElement = document.getElementById('duration');

let stream = null;
let autoTimer = null;
let requestInProgress = false;

function setStatus(message, isError = false) {
  statusElement.textContent = message || '';
  statusElement.classList.toggle('error', Boolean(isError));
}

function setSharingUI(active) {
  shareButton.disabled = active;
  analyzeButton.disabled = !active;
  stopButton.disabled = !active;
  autoCheckbox.disabled = !active;
  preview.classList.toggle('visible', active);
  placeholder.style.display = active ? 'none' : 'flex';
  liveBadge.textContent = active ? '● Sharing' : 'Not sharing';
  liveBadge.classList.toggle('live', active);
}

async function startSharing() {
  setStatus('');
  if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
    setStatus('Screen sharing is not supported in this Chrome context. Update Chrome and try again.', true);
    return;
  }

  try {
    stream = await navigator.mediaDevices.getDisplayMedia({
      video: { frameRate: { ideal: 15, max: 30 } },
      audio: false
    });
    preview.srcObject = stream;
    await preview.play();
    const track = stream.getVideoTracks()[0];
    if (track) track.addEventListener('ended', stopSharing, { once: true });
    setSharingUI(true);
    setStatus('Screen is shared. Click Analyze screen when the question is visible.');
  } catch (error) {
    if (error && error.name === 'NotAllowedError') {
      setStatus('Screen sharing was cancelled or permission was denied.', true);
    } else {
      setStatus((error && error.message) || 'Could not start screen sharing.', true);
    }
  }
}

function captureFrame() {
  if (!stream || !preview.videoWidth || !preview.videoHeight) {
    throw new Error('Wait for the screen preview to appear, then try again.');
  }

  const maxDimension = 1280;
  const scale = Math.min(1, maxDimension / Math.max(preview.videoWidth, preview.videoHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(preview.videoWidth * scale));
  canvas.height = Math.max(1, Math.round(preview.videoHeight * scale));
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Could not prepare the screenshot.');
  context.drawImage(preview, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.78);
}

async function analyzeScreen() {
  if (requestInProgress || !stream) return;
  requestInProgress = true;
  analyzeButton.disabled = true;
  answerElement.classList.remove('empty');
  answerElement.textContent = 'Analyzing screen…';
  durationElement.textContent = '';
  setStatus('');

  try {
    const image = captureFrame();
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image,
        language: 'auto',
        subject: 'auto',
        selectedQuestionIndex: 0,
        fastMode: true
      })
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.success === false) {
      throw new Error(payload.error || 'The AI server could not analyze this screen.');
    }

    const result = payload.data || payload;
    const answer = typeof result.correctAnswerText === 'string'
      ? result.correctAnswerText.trim()
      : '';
    if (!answer) throw new Error('The AI returned no answer. Try capturing a clearer screen.');

    answerElement.textContent = answer;
    durationElement.textContent = ((result.durationMs || payload.durationMs || 0) / 1000).toFixed(1) + 's';
    setStatus('');
  } catch (error) {
    answerElement.classList.add('empty');
    answerElement.textContent = 'No answer yet.';
    setStatus((error && error.message) || 'Analysis failed. Please try again.', true);
  } finally {
    requestInProgress = false;
    analyzeButton.disabled = !stream;
  }
}

function stopSharing() {
  if (autoTimer) {
    clearInterval(autoTimer);
    autoTimer = null;
  }
  autoCheckbox.checked = false;
  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
    stream = null;
  }
  preview.srcObject = null;
  setSharingUI(false);
  setStatus('Screen sharing stopped.');
}

shareButton.addEventListener('click', startSharing);
analyzeButton.addEventListener('click', analyzeScreen);
stopButton.addEventListener('click', stopSharing);
autoCheckbox.addEventListener('change', () => {
  if (autoTimer) {
    clearInterval(autoTimer);
    autoTimer = null;
  }
  if (autoCheckbox.checked && stream) {
    setStatus('Auto-analysis is on. It checks every 15 seconds; stay within your API quota.');
    autoTimer = setInterval(() => {
      if (!requestInProgress && stream) analyzeScreen();
    }, 15000);
  } else {
    setStatus('Auto-analysis is off.');
  }
});

window.addEventListener('beforeunload', () => {
  if (autoTimer) clearInterval(autoTimer);
  if (stream) stream.getTracks().forEach((track) => track.stop());
});