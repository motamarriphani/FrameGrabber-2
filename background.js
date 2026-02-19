// background.js - Handles download requests from the content script

const DEFAULT_DOWNLOAD_SETTINGS = {
  saveAs: false
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action !== 'downloadFrame') {
    return false;
  }

  if (!request.imageDataUrl || !request.filename) {
    sendResponse({ success: false, error: 'Invalid data received.' });
    return false;
  }

  chrome.storage.local.get(DEFAULT_DOWNLOAD_SETTINGS)
    .then((settings) => chrome.downloads.download({
      url: request.imageDataUrl,
      filename: request.filename,
      saveAs: Boolean(settings.saveAs)
    }))
    .then((downloadId) => {
      if (downloadId === undefined) {
        sendResponse({ success: false, error: 'Download failed to start. Check browser settings.' });
        return;
      }
      sendResponse({ success: true, downloadId });
    })
    .catch((error) => {
      sendResponse({ success: false, error: String(error) });
    });

  return true;
});
