// background.js - Handles download requests from the content script

/**
 * Listener for messages from the content script.
 * Expects a message with action: "downloadFrame" and data containing
 * the imageDataUrl, filename.
 */

// This is for user file preference.
const getUserFilePreference = () => {
  return new Promise((resolve) => {
    chrome.storage.local.get(['filePreference'], (result) => {
      resolve(result.filePreference || 'png'); // Default to 'png' if not set
    });
  });
};


// This is for reading the save location.
const getSaveLocation = () => {
  return new Promise((resolve) => {
    chrome.storage.local.get(['saveLocation'], (result) => {
      resolve(result.saveLocation || ''); // Default to empty if not set
    });
  });
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "downloadFrame") {
      console.log("Background script received download request:", request); // For debugging
  
      if (!request.imageDataUrl || !request.filename) {
        console.error("Background script received invalid download request data.");
        sendResponse({ success: false, error: "Invalid data received." });
        return false; // Indicate asynchronous response is not needed or error
      }
  
      // Use the chrome.downloads API to save the image
      chrome.downloads.download({
        url: request.imageDataUrl, // The base64 data URL of the image
        filename: request.filename, // The suggested filename
        saveAs: false // Set to true to prompt user for save location, false to auto-download
      })
      .then(downloadId => {
        if (chrome.runtime.lastError) {
          // Check for errors during download initiation
          console.error("Download initiation failed:", chrome.runtime.lastError.message);
          sendResponse({ success: false, error: chrome.runtime.lastError.message });
        } else if (downloadId === undefined) {
          // Sometimes downloadId is undefined even without an explicit error (e.g., blocked by browser settings)
           console.warn("Download did not start. Download ID is undefined. Check browser download settings.");
           sendResponse({ success: false, error: "Download failed to start. Check browser settings." });
        }
         else {
          console.log("Download started with ID:", downloadId);
          sendResponse({ success: true, downloadId: downloadId });
        }
      })
      .catch(error => {
          // Catch any promise rejection errors
           console.error("Download failed:", error);
           sendResponse({ success: false, error: error.toString() });
      });
  
      // Return true to indicate you wish to send a response asynchronously
      return true;
    }
    // Handle other potential message types if needed in the future
    return false; // No async response for other message types
  });
  
  console.log("Background script loaded."); // For debugging
  