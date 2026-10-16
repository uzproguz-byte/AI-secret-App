const API_URL = 'https://ai-secret-app-production.up.railway.app/api/analyze';

const preview = document.getElementById('preview');
const mainAction = document.getElementById('mainAction');
const answerElement = document.getElementById('answer');
const statusElement = document.getElementById('status');
const liveBadge = document.getElementById('liveBadge');

let stream = null;
let requestInProgress = false;

function setStatus(message, isError = false) {
  statusElement.textContent = message || '';
  statusElement.classList.toggle('error', Boolean(isError));
}

function setSharingUI(active) {
  mainAction.textContent = active ? 'Analyze screen' : 'Share screen';
  mainAction.disabled = Boolean(active && requestInProgress);
  liveBadge.textContent = active ? '● Sharing' : 'Not sharing';
  liveBadge.classList.toggle('live', active);
}

async function startSharing() {
  setStatus('');
  if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
    setStatus('Screen sharing is not supported here. Update Chrome and try again.', true);
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
    setStatus('Screen shared. Click Analyze screen when the question is visible.');
  } catch (error) {
    if (stream) stream.getTracks().forEach((track) => track.stop());
    stream = null;
    setSharingUI(false);
    if (error && error.name === 'NotAllowedError') {
      setStatus('Screen sharing was cancelled or permission was denied.', true);
    } else {
      setStatus((error && error.message) || 'Could not start screen sharing.', true);
    }
  }
}

function captureFrame() {
  if (!stream || !preview.videoWidth || !preview.videoHeight) {
    throw new Error('Wait a moment for screen sharing to start, then try again.');
  }

  const maxDimension = 1280;
  const scale = Math.min(1, maxDimension / Math.max(preview.videoWidth, preview.videoHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(preview.videoWidth * scale));
  canvas.height = Math.max(1, Math.round(preview.videoHeight * scale));
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Could not prepare the screenshot.');
  context.drawImage(preview, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.82);
}

function normalizeLabel(value) {
  const match = String(value || '').trim().match(/^(?:option\s*)?([A-Z0-9])(?:[\s).:,\-]|$)/i);
  return match ? match[1].toUpperCase() : '';
}

function formatAnswer(result) {
  const answerText = typeof result.correctAnswerText === 'string'
    ? result.correctAnswerText.trim()
    : '';
  const options = Array.isArray(result.options) ? result.options : [];

  const markedCorrect = options.filter((option) => option && option.isCorrect === true);
  let selectedOption = markedCorrect.length === 1 ? markedCorrect[0] : null;
  let label = selectedOption ? normalizeLabel(selectedOption.label) : '';

  if (!selectedOption) {
    label = normalizeLabel(result.correctAnswerLabel) || normalizeLabel(answerText);
    selectedOption = options.find((option) => normalizeLabel(option && option.label) === label);
  }

  if (selectedOption && label && typeof selectedOption.text === 'string' && selectedOption.text.trim()) {
    return label + ') ' + selectedOption.text.trim();
  }

  if (label && !/^direct answer$/i.test(String(result.correctAnswerLabel || '').trim()) &&
      !new RegExp('^' + label + '(?:[).:\\s-]|$)', 'i').test(answerText)) {
    return label + ') ' + answerText;
  }

  return answerText;
}

async function analyzeScreen() {
  if (requestInProgress || !stream) return;

  requestInProgress = true;
  mainAction.disabled = true;
  mainAction.textContent = 'Analyzing…';
  answerElement.classList.remove('empty');
  answerElement.textContent = 'Analyzing screen…';
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
    const answer = formatAnswer(result);
    if (!answer) throw new Error('The AI returned no answer. Try a clearer screen.');

    answerElement.textContent = answer;
    setStatus('');
  } catch (error) {
    answerElement.classList.add('empty');
    answerElement.textContent = 'No answer yet.';
    setStatus((error && error.message) || 'Analysis failed. Please try again.', true);
  } finally {
    requestInProgress = false;
    mainAction.disabled = !stream;
    mainAction.textContent = stream ? 'Analyze screen' : 'Share screen';
  }
}

function stopSharing() {
  if (stream) {
    const oldStream = stream;
    stream = null;
    oldStream.getTracks().forEach((track) => track.stop());
  }
  preview.srcObject = null;
  setSharingUI(false);
  setStatus('Screen sharing stopped.');
}

mainAction.addEventListener('click', () => {
  if (stream) {
    analyzeScreen();
  } else {
    startSharing();
  }
});

window.addEventListener('beforeunload', () => {
  if (stream) stream.getTracks().forEach((track) => track.stop());
});
