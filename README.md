# YouTube FrameGrabber2

YouTube FrameGrabber2 is a Chrome extension that adds a **Grab Frame** button to YouTube watch pages and lets you save the currently displayed video frame as an image.

## What this application does

When you open a YouTube video (`youtube.com/watch...`), the extension:

1. Injects a **Grab Frame** button into the YouTube player controls.
2. Captures the current frame from the HTML5 video element.
3. Converts that frame to an image format you choose.
4. Downloads the image with a customizable filename and optional subfolder.

## Main features

- **Capture current frame from YouTube video player**
- **Multiple output formats**
  - PNG
  - JPEG (with quality setting)
  - WebP
- **Custom filename templates** with supported tokens:
  - `{title}` → video title
  - `{time}` → current playback time (for example `01m35s`)
  - `{date}` → capture date (`YYYY-MM-DD`)
- **Download settings**
  - Optional subfolder inside Downloads (for example `FrameGrabber/`)
  - Optional “Ask where to save” prompt for each capture
- **Popup settings UI** to configure preferences

## How it works (architecture)

- `content.js`
  - Runs on YouTube watch pages.
  - Injects the grab button.
  - Captures the frame on click using a canvas.
  - Reads user settings from `chrome.storage.local`.
  - Sends the generated image data + filename to the background script.

- `background.js`
  - Receives capture messages.
  - Starts downloads via `chrome.downloads.download`.
  - Applies the `saveAs` setting.

- `popup.html` + `popup.js`
  - Settings UI for format, quality, filename template, and download behavior.
  - Persists settings in `chrome.storage.local`.
  - Includes one-time migration from legacy popup `localStorage` keys.

## Installation (developer mode)

1. Clone or download this repository.
2. Open Chrome and go to `chrome://extensions`.
3. Enable **Developer mode**.
4. Click **Load unpacked**.
5. Select this project folder (`FrameGrabber-2`).

## Usage

1. Open a YouTube watch page.
2. (Optional) Open extension popup and set:
   - Image type
   - JPEG quality
   - Filename template
   - Download subfolder
   - Save prompt behavior
3. Click **Grab Frame** on the video controls.
4. The frame is downloaded according to your settings.

## Notes and limitations

- Capture works only on URLs matching YouTube watch pages.
- Download location is limited by Chrome extension APIs:
  - You can provide a relative subfolder in Downloads.
  - You cannot write arbitrary absolute filesystem paths.
- If YouTube changes its player DOM structure significantly, button injection selectors may need updates.

## Project status

This is an actively iterated extension MVP focused on core frame capture and configurable output behavior.
