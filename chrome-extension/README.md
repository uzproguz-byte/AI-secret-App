# AI Study Assistant Chrome Extension

A small Chrome extension that opens a dedicated compact window, requests screen-sharing permission, and sends a still frame to the existing Railway AI backend when you click **Analyze screen**.

## Install locally

1. Download or clone this repository.
2. Open `chrome://extensions` in Google Chrome.
3. Turn on **Developer mode**.
4. Click **Load unpacked**.
5. Select the `chrome-extension` folder from this repository.
6. Click the AI Study Assistant extension icon and choose **Open screen assistant**.
7. Click **Share screen**, select a tab/window/screen in Chrome's permission dialog, then click **Analyze screen**.

## Privacy behavior

- Chrome asks you to select what to share.
- The live video preview stays in the extension window.
- A JPEG still frame is sent to `https://ai-secret-app-production.up.railway.app/api/analyze` only when you click Analyze screen, or when you explicitly enable auto-analysis.
- Click **Stop sharing** or close the assistant window to stop capture.
- Do not share private information unless you intend to send it for analysis.

## Notes

- This is a local unpacked extension, not yet published on the Chrome Web Store.
- The backend API must be online and configured with its server-side Gemini key.
- Auto-analysis checks every 15 seconds; leave it off if you want to control every request or avoid API quota limits.
