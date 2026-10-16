# AI Answer Chrome Extension

A compact Chrome extension with one main button: **Share screen**, then **Analyze screen**. The answer appears underneath. Multiple-choice answers include the option letter and text (for example, `B) Paris`).

## Install

1. Download the extension ZIP and extract it.
2. Open `chrome://extensions` in Chrome.
3. Turn on **Developer mode**.
4. Click **Load unpacked**.
5. Select the extracted `chrome-extension` folder.

Click the extension icon to open the small assistant window. Click **Share screen**, choose a tab/window/screen in Chrome's picker, then click **Analyze screen**.

## Privacy

Chrome asks you to choose what to share. A still screenshot is sent to `https://ai-secret-app-production.up.railway.app/api/analyze` only when you click **Analyze screen**. The extension does not continuously upload video. Close the assistant window or stop sharing through Chrome to end capture.

The backend must be online for answers to work. This is a local unpacked extension, not a Chrome Web Store publication.
