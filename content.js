// content.js - Injects button, captures frame, and sends to background.js

/**
 * Waits for an element matching the selector to appear in the DOM.
 * @param {string} selector - The CSS selector to wait for.
 * @param {number} timeout - Maximum time to wait in milliseconds.
 * @returns {Promise<Element>} - Promise resolving with the element or rejecting on timeout.
 */
function waitForElement(selector, timeout = 15000) {
    return new Promise((resolve, reject) => {
      const intervalTime = 500; // Check every 500ms
      let elapsedTime = 0;
  
      const interval = setInterval(() => {
        const element = document.querySelector(selector);
        if (element) {
          clearInterval(interval);
          resolve(element);
        } else {
          elapsedTime += intervalTime;
          if (elapsedTime >= timeout) {
            clearInterval(interval);
            reject(new Error(`Element "${selector}" not found within ${timeout}ms.`));
          }
        }
      }, intervalTime);
    });
  }
  
  /**
   * Formats seconds into MMmSSs format.
   * @param {number} totalSeconds - The total seconds to format.
   * @returns {string} - Formatted time string (e.g., "01m35s").
   */
  function formatTime(totalSeconds) {
    const seconds = Math.floor(totalSeconds % 60);
    const minutes = Math.floor(totalSeconds / 60);
    return `${String(minutes).padStart(2, '0')}m${String(seconds).padStart(2, '0')}s`;
  }
  
  /**
   * Sanitizes a string to be used as a valid filename.
   * Removes or replaces characters that are problematic in filenames.
   * @param {string} name - The original string.
   * @returns {string} - The sanitized string.
   */
  function sanitizeFilename(name) {
    // Remove leading/trailing whitespace
    name = name.trim();
    // Replace problematic characters with underscores
    // Characters: / \ ? % * : | " < > . , ; = [ ]
    name = name.replace(/[/\\?%*:|"<>\.,;=\[\]]/g, '_');
    // Replace multiple consecutive underscores with a single one
    name = name.replace(/__+/g, '_');
    // Limit length (optional, but good practice)
    const maxLength = 100;
    if (name.length > maxLength) {
      name = name.substring(0, maxLength).trimEnd('_'); // Avoid ending with _ if truncated
    }
    // Ensure filename isn't empty after sanitization
    if (!name) {
      return "youtube_frame";
    }
    return name;
  }
  
  
  /**
   * Creates and injects the "Grab Frame" button into the YouTube player controls.
   * @param {Element} controlsContainer - The DOM element to inject the button into.
   */
  function injectGrabButton(controlsContainer) {
      // Check if button already exists to prevent duplicates on potential re-injection
      if (document.getElementById('yt-frame-grabber-btn')) {
          console.log("Frame Grabber button already exists.");
          return;
      }
  
      const grabButton = document.createElement('button');
      grabButton.id = 'yt-frame-grabber-btn';
      grabButton.className = 'ytp-button yt-frame-grabber-button'; // Use YouTube's class + custom class
      grabButton.title = 'Grab Current Frame (YouTube Frame Grabber)';
      grabButton.innerText = 'Grab Frame'; // Simple text, or use an SVG/Image icon
  
      // Add click listener to the button
      grabButton.addEventListener('click', handleGrabFrameClick);
  
      // Inject the button into the controls container
      // YouTube might change this structure. '.ytp-right-controls' is common.
      if (controlsContainer) {
          // Insert it before the settings button for visibility
          const settingsButton = controlsContainer.querySelector('.ytp-settings-button');
          if (settingsButton) {
               controlsContainer.insertBefore(grabButton, settingsButton);
               console.log("Frame Grabber button injected.");
          } else {
              // Fallback: append if settings button not found
              controlsContainer.appendChild(grabButton);
               console.log("Frame Grabber button injected (fallback append).");
          }
  
      } else {
          console.error("Could not find YouTube player controls container to inject button.");
      }
  }
  
  /**
   * Handles the click event on the "Grab Frame" button.
   */
  async function handleGrabFrameClick() {
      console.log("Grab Frame button clicked.");
      const grabButton = document.getElementById('yt-frame-grabber-btn');
      if (!grabButton) return; // Should not happen, but safety check
  
      // Provide visual feedback
      const originalText = grabButton.innerText;
      grabButton.innerText = 'Grabbing...';
      grabButton.disabled = true;
  
      try {
          // 1. Find the primary video element
          // This selector might need updates if YouTube changes its structure.
          const videoElement = document.querySelector('#movie_player video.html5-main-video');
          if (!videoElement) {
              throw new Error("Could not find the main YouTube video element.");
          }
  
          // 2. Get video title and current time for filename
          let videoTitle = "youtube_video"; // Default title
          try {
              // Try getting title from player API if available (more robust)
              const player = document.getElementById('movie_player'); // YouTube's player element
               if (player && typeof player.getVideoData === 'function') {
                   const videoData = player.getVideoData();
                   if (videoData && videoData.title) {
                       videoTitle = videoData.title;
                   } else {
                       // Fallback to document title if API fails
                        videoTitle = document.title.replace(/ - YouTube$/, '').trim(); // Clean up typical YouTube title suffix
                   }
               } else {
                   // Fallback to document title
                   videoTitle = document.title.replace(/ - YouTube$/, '').trim();
               }
          } catch (titleError) {
               console.warn("Could not reliably get video title, using fallback.", titleError);
               // Use document title as a last resort
               videoTitle = document.title.replace(/ - YouTube$/, '').trim();
          }
  
  
          const currentTime = videoElement.currentTime; // Time in seconds
          const formattedTime = formatTime(currentTime);
          const sanitizedTitle = sanitizeFilename(videoTitle);
          const filename = `${sanitizedTitle}_frame_${formattedTime}.png`;
  
          // 3. Create an offscreen canvas
          const canvas = document.createElement('canvas');
          canvas.width = videoElement.videoWidth;   // Use intrinsic video dimensions for quality
          canvas.height = videoElement.videoHeight;
  
          // 4. Draw the current video frame onto the canvas
          const ctx = canvas.getContext('2d');
          if (!ctx) {
               throw new Error("Could not get 2D context from canvas.");
          }
          ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
  
          // 5. Convert canvas content to a PNG data URL
          const imageDataUrl = canvas.toDataURL('image/png');
  
          // 6. Send data URL and filename to the background script for download
          console.log("Sending message to background script:", { filename, imageDataUrlLength: imageDataUrl.length });
          const response = await chrome.runtime.sendMessage({
              action: "downloadFrame",
              imageDataUrl: imageDataUrl,
              filename: filename
          });
  
          console.log("Response from background script:", response); // For debugging
          if (response && response.success) {
              console.log("Frame grab successful, download initiated.");
              grabButton.innerText = 'Grabbed!'; // Success feedback
          } else {
              console.error("Frame grab failed:", response?.error || "Unknown error");
              grabButton.innerText = 'Error'; // Error feedback
              // Optional: show a more user-friendly error message on the page
          }
  
      } catch (error) {
          console.error("Error during frame grab:", error);
          grabButton.innerText = 'Error'; // Error feedback
          alert(`Frame Grabber Error: ${error.message}`); // Simple alert for now
      } finally {
          // Restore button state after a short delay
          setTimeout(() => {
              grabButton.innerText = originalText;
              grabButton.disabled = false;
          }, 2000); // Restore after 2 seconds
      }
  }
  
  // --- Main Execution ---
  
  // Use waitForElement to ensure player controls are loaded before injecting
  // YouTube might load the player dynamically.
  const controlsSelector = '.ytp-right-controls'; // Target container for injection
  waitForElement(controlsSelector)
    .then(controlsContainer => {
      injectGrabButton(controlsContainer);
    })
    .catch(error => {
      console.error("Frame Grabber init failed:", error);
      // Optionally, try again or notify user if controls never appear
    });
  
  // Alternative: Use MutationObserver for more robustness against dynamic loading
  // const observer = new MutationObserver((mutationsList, observer) => {
  //     for(const mutation of mutationsList) {
  //         if (mutation.type === 'childList') {
  //             const controlsContainer = document.querySelector(controlsSelector);
  //             if (controlsContainer && !document.getElementById('yt-frame-grabber-btn')) {
  //                 injectGrabButton(controlsContainer);
  //                 // Optional: disconnect observer if button only needs to be added once
  //                 // observer.disconnect();
  //                 break; // Exit loop once found
  //             }
  //         }
  //     }
  // });
  
  // Start observing the body for changes (might need a more specific target)
  // observer.observe(document.body, { childList: true, subtree: true });
  
  console.log("YouTube Frame Grabber content script loaded."); // For debugging
  