# AI Answer Chrome Extension

Screen Solver opens a larger window with two separate buttons: **Share Screen** and **Analyze Screen**. Your result appears in a large answer panel, with the multiple-choice letter displayed prominently when available.

## Install

1. Download this ZIP and extract it.
2. Open \`chrome://extensions\` in Chrome.
3. Turn on **Developer mode**.
4. Click **Load unpacked**.
5. Select the extracted \`ai-answer-extension\` folder.

Click the extension icon to open Screen Solver. Press **Share Screen** and choose a tab/window/monitor in Chrome's screen picker. When the screen is shared, press **Analyze Screen**. The Analyze button is visible all the time and becomes active after sharing starts. Press **Stop Sharing** when finished.

## Privacy

Chrome asks you to choose what to share. A still screenshot is sent to \`https://ai-secret-app-production.up.railway.app/api/analyze\` only when you press **Analyze Screen**. The extension does not continuously upload video. Closing the assistant or pressing Stop Sharing ends capture.

The backend must be online for answers to work. This is a local unpacked extension, not a Chrome Web Store publication.
