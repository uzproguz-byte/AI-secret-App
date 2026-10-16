const API_URL = 'https://ai-secret-app-production.up.railway.app/api/analyze';

const preview = document.getElementById('preview');
const placeholder = document.getElementById('placeholder');
const previewHint = document.getElementById('previewHint');
const shareButton = document.getElementById('share');
const shareLabel = document.getElementById('shareLabel');
const analyzeButton = document.getElementById('analyze');
const analyzeLabel = document.getElementById('analyzeLabel');
const answerElement = document.getElementById('answer');
const answerLetter = document.getElementById('answerLetter');
const answerTag = document.getElementById('answerTag');
const explanationElement = document.getElementById('explanation');
const statusElement = document.getElementById('status');
const liveBadge = document.getElementById('liveBadge');

let stream = null;
let requestInProgress = false;

function setStatus(message, isError = false) {
  statusElement.textContent = message || '';
  statusElement.classList.toggle('error', Boolean(isError));
}

function setSharingUI(active) {
  shareLabel.textContent = active ? 'Stop Sharing' : 'Share Screen';
  shareButton.disabled = requestInProgress;
  analyzeButton.disabled = !active || requestInProgress;
  liveBadge.innerHTML = active
    ? '<span class="badge-dot"></span> Screen shared'
    : '<span class="badge-dot"></span> Not sharing';
  liveBadge.classList.toggle('live', active);
  preview.classList.toggle('visible', active);
  placeholder.style.display = active ? 'none' : 'flex';
  previewHint.textContent = active ? 'Live preview' : 'Waiting for screen';
}

async function startSharing() {
  setStatus('');
  if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
    setStatus('Screen sharing is not supported here. Try the latest Google Chrome.', true);
    return;
  }

  shareButton.disabled = true;
  shareLabel.textContent = 'Opening picker…';
  try {
    const newStream = await navigator.mediaDevices.getDisplayMedia({
      video: { frameRate: { ideal: 15, max: 30 } },
      audio: false
    });
    stream = newStream;
    preview.srcObject = stream;
    await preview.play();

    const track = stream.getVideoTracks()[0];
    if (track) track.addEventListener('ended', stopSharing, { once: true });

    setSharingUI(true);
    setStatus('Screen is ready. Click Analyze Screen when your question is visible.');
    answerTag.textContent = 'READY TO ANALYZE';
  } catch (error) {
    if (stream) stream.getTracks().forEach((track) => track.stop());
    stream = null;
    setSharingUI(false);
    if (error && error.name === 'NotAllowedError') {
      setStatus('Screen sharing was cancelled or permission was denied.', true);
    } else {
      setStatus((error && error.message) || 'Could not start screen sharing.', true);
    }
  } finally {
    shareButton.disabled = false;
    shareLabel.textContent = stream ? 'Stop Sharing' : 'Share Screen';
  }
}

function captureFrame() {
  if (!stream || !preview.videoWidth || !preview.videoHeight) {
    throw new Error('Wait for the screen preview to appear, then try again.');
  }
  const maxDimension = 1600;
  const scale = Math.min(1, maxDimension / Math.max(preview.videoWidth, preview.videoHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(preview.videoWidth * scale));
  canvas.height = Math.max(1, Math.round(preview.videoHeight * scale));
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Could not prepare the screenshot.');
  context.drawImage(preview, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.84);
}

function normalizeLabel(value) {
  const match = String(value || '').trim().match(/^(?:option\s*)?([A-Z0-9])(?:[\s).:,\-]|$)/i);
  return match ? match[1].toUpperCase() : '';
}

function getAnswerPresentation(result) {
  const rawAnswer = typeof result.correctAnswerText === 'string' ? result.correctAnswerText.trim() : '';
  const options = Array.isArray(result.options) ? result.options : [];
  const markedCorrect = options.filter((option) => option && option.isCorrect === true);
  let selected = markedCorrect.length === 1 ? markedCorrect[0] : null;
  let label = selected ? normalizeLabel(selected.label) : '';

  if (!selected) {
    label = normalizeLabel(result.correctAnswerLabel);
    if (!label) label = normalizeLabel(rawAnswer);
    selected = options.find((option) => normalizeLabel(option && option.label) === label) || null;
  }

  if (selected && label && typeof selected.text === 'string' && selected.text.trim()) {
    return { label, text: selected.text.trim() };
  }

  const answerStartsWithLabel = label && new RegExp('^' + label + '(?:[).:\\s-]|$)', 'i').test(rawAnswer);
  if (label && !/^direct answer$/i.test(String(result.correctAnswerLabel || '').trim()) && answerStartsWithLabel) {
    return { label, text: rawAnswer.replace(new RegExp('^' + label + '(?:[).:\\s-]+)?', 'i'), '').trim() };
  }

  return { label: '', text: rawAnswer };
}

async function analyzeScreen() {
  if (requestInProgress || !stream) return;
  requestInProgress = true;
  analyzeButton.disabled = true;
  shareButton.disabled = true;
  analyzeLabel.textContent = 'Analyzing…';
  answerElement.classList.remove('empty');
  answerElement.textContent = 'Reading your screen…';
  answerLetter.hidden = true;
  explanationElement.hidden = true;
  answerTag.textContent = 'WORKING…';
  setStatus('Finding the question and checking the answer…');

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
        fastMode: false
      })
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.success === false) {
      throw new Error(payload.error || 'The AI server could not analyze this screen.');
    }

    const result = payload.data || payload;
    const presentation = getAnswerPresentation(result);
    if (!presentation.text) throw new Error('The AI returned no answer. Try a clearer screen.');

    answerElement.classList.remove('empty');
    answerElement.textContent = presentation.text;
    if (presentation.label) {
      answerLetter.textContent = presentation.label;
      answerLetter.hidden = false;
      answerTag.textContent = 'CORRECT OPTION';
    } else {
      answerLetter.hidden = true;
      answerTag.textContent = 'ANSWER FOUND';
    }

    const explanation = typeof result.summaryExplanation === 'string' ? result.summaryExplanation.trim() : '';
    if (explanation && explanation !== presentation.text) {
      explanationElement.textContent = explanation;
      explanationElement.hidden = false;
    }
    setStatus('');
  } catch (error) {
    answerElement.classList.add('empty');
    answerElement.textContent = 'Could not get an answer. Try sharing a clearer screen.';
    answerLetter.hidden = true;
    answerTag.textContent = 'TRY AGAIN';
    setStatus((error && error.message) || 'Analysis failed. Please try again.', true);
  } finally {
    requestInProgress = false;
    setSharingUI(Boolean(stream));
    shareButton.disabled = false;
    analyzeButton.disabled = !stream;
    analyzeLabel.textContent = 'Analyze Screen';
    shareLabel.textContent = stream ? 'Stop Sharing' : 'Share Screen';
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
  setStatus('Screen sharing stopped. Click Share Screen to start again.');
  answerTag.textContent = 'READY WHEN YOU ARE';
}

shareButton.addEventListener('click', () => {
  if (stream) stopSharing();
  else startSharing();
});
analyzeButton.addEventListener('click', analyzeScreen);
window.addEventListener('beforeunload', () => {
  if (stream) stream.getTracks().forEach((track) => track.stop());
});
