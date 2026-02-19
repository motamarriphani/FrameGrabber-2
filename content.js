// content.js - Injects button, captures frame, and sends to background.js

const DEFAULT_SETTINGS = {
  imageType: 'png',
  saveLocation: '',
  filenameTemplate: '{title}_frame_{time}',
  jpegQuality: 0.92
};

const SUPPORTED_IMAGE_TYPES = new Set(['png', 'jpeg', 'webp']);

function waitForElement(selector, timeout = 15000) {
  return new Promise((resolve, reject) => {
    const intervalTime = 500;
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

function formatTime(totalSeconds) {
  const seconds = Math.floor(totalSeconds % 60);
  const minutes = Math.floor(totalSeconds / 60);
  return `${String(minutes).padStart(2, '0')}m${String(seconds).padStart(2, '0')}s`;
}

function formatDate(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function sanitizeFilename(name) {
  const trimmed = (name || '').trim();
  const sanitized = trimmed
    .replace(/[/\\?%*:|"<>\.,;=\[\]]/g, '_')
    .replace(/__+/g, '_')
    .slice(0, 100)
    .trimEnd('_');

  return sanitized || 'youtube_frame';
}

function sanitizeFolderPath(path) {
  return (path || '')
    .split('/')
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0)
    .map((segment) => sanitizeFilename(segment))
    .filter(Boolean)
    .join('/');
}

function getMimeType(imageType) {
  if (imageType === 'jpeg') return 'image/jpeg';
  if (imageType === 'webp') return 'image/webp';
  return 'image/png';
}

function extensionForType(imageType) {
  if (imageType === 'jpeg') return 'jpg';
  return imageType;
}

function buildFilename(videoTitle, formattedTime, extension, template) {
  const base = (template || DEFAULT_SETTINGS.filenameTemplate)
    .replaceAll('{title}', sanitizeFilename(videoTitle))
    .replaceAll('{time}', formattedTime)
    .replaceAll('{date}', formatDate());

  return `${sanitizeFilename(base)}.${extension}`;
}

async function getSettings() {
  const settings = await chrome.storage.local.get(DEFAULT_SETTINGS);
  const imageType = SUPPORTED_IMAGE_TYPES.has(settings.imageType) ? settings.imageType : DEFAULT_SETTINGS.imageType;

  return {
    ...DEFAULT_SETTINGS,
    ...settings,
    imageType,
    jpegQuality: Math.min(1, Math.max(0.1, Number.parseFloat(settings.jpegQuality) || DEFAULT_SETTINGS.jpegQuality))
  };
}

function injectGrabButton(controlsContainer) {
  if (document.getElementById('yt-frame-grabber-btn')) {
    return;
  }

  const grabButton = document.createElement('button');
  grabButton.id = 'yt-frame-grabber-btn';
  grabButton.className = 'ytp-button yt-frame-grabber-button';
  grabButton.title = 'Grab Current Frame (YouTube Frame Grabber)';
  grabButton.innerText = 'Grab Frame';
  grabButton.addEventListener('click', handleGrabFrameClick);

  const settingsButton = controlsContainer.querySelector('.ytp-settings-button');
  if (settingsButton) {
    controlsContainer.insertBefore(grabButton, settingsButton);
  } else {
    controlsContainer.appendChild(grabButton);
  }
}

async function handleGrabFrameClick() {
  const grabButton = document.getElementById('yt-frame-grabber-btn');
  if (!grabButton) return;

  const originalText = grabButton.innerText;
  grabButton.innerText = 'Grabbing...';
  grabButton.disabled = true;

  try {
    const settings = await getSettings();

    const videoElement = document.querySelector('#movie_player video.html5-main-video');
    if (!videoElement) {
      throw new Error('Could not find the main YouTube video element.');
    }

    let videoTitle = 'youtube_video';
    try {
      const player = document.getElementById('movie_player');
      if (player && typeof player.getVideoData === 'function') {
        const videoData = player.getVideoData();
        videoTitle = videoData?.title || document.title.replace(/ - YouTube$/, '').trim();
      } else {
        videoTitle = document.title.replace(/ - YouTube$/, '').trim();
      }
    } catch {
      videoTitle = document.title.replace(/ - YouTube$/, '').trim();
    }

    const currentTime = videoElement.currentTime;
    const formattedTime = formatTime(currentTime);
    const extension = extensionForType(settings.imageType);
    const fileNameOnly = buildFilename(videoTitle, formattedTime, extension, settings.filenameTemplate);
    const folder = sanitizeFolderPath(settings.saveLocation);
    const fullFilename = folder ? `${folder}/${fileNameOnly}` : fileNameOnly;

    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get 2D context from canvas.');
    }

    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

    const mimeType = getMimeType(settings.imageType);
    const imageDataUrl = settings.imageType === 'jpeg'
      ? canvas.toDataURL(mimeType, settings.jpegQuality)
      : canvas.toDataURL(mimeType);

    const response = await chrome.runtime.sendMessage({
      action: 'downloadFrame',
      imageDataUrl,
      filename: fullFilename
    });

    if (response && response.success) {
      grabButton.innerText = 'Grabbed!';
    } else {
      throw new Error(response?.error || 'Unknown error');
    }
  } catch (error) {
    console.error('Error during frame grab:', error);
    grabButton.innerText = 'Error';
    alert(`Frame Grabber Error: ${error.message}`);
  } finally {
    setTimeout(() => {
      grabButton.innerText = originalText;
      grabButton.disabled = false;
    }, 2000);
  }
}

const controlsSelector = '.ytp-right-controls';
waitForElement(controlsSelector)
  .then((controlsContainer) => {
    injectGrabButton(controlsContainer);
  })
  .catch((error) => {
    console.error('Frame Grabber init failed:', error);
  });
