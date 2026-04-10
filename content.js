let lockCaptionsEnabled = false;

// Load initial lock setting
chrome.storage.local.get(['lockCaptions'], (result) => {
  lockCaptionsEnabled = !!result.lockCaptions;
  applyLock();
});

// Listen for storage changes
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.lockCaptions) {
    lockCaptionsEnabled = changes.lockCaptions.newValue;
    applyLock();
  }
});

function applyLock() {
  const turnOffButton = document.querySelector('button[aria-label="Turn off captions"], [aria-label="Turn off captions (c)"]');
  if (lockCaptionsEnabled && turnOffButton) {
    turnOffButton.disabled = true;
    turnOffButton.style.opacity = '0.5';
    turnOffButton.title = "Captions are locked by Meeting Take Note";
  } else if (!lockCaptionsEnabled && turnOffButton) {
    turnOffButton.disabled = false;
    turnOffButton.style.opacity = '1';
    turnOffButton.title = "";
  }
}

function autoEnableCaptions() {
  const turnOnButton = document.querySelector('button[aria-label="Turn on captions"], [aria-label="Turn on captions (c)"]');
  if (turnOnButton) {
    console.log('Meeting Take Note: Enabling captions...');
    turnOnButton.click();
    // Re-apply lock after a short delay to catch the button state change
    setTimeout(applyLock, 500);
    return true;
  }
  return false;
}

// Observer: Stops after the first successful click
const observer = new MutationObserver(() => {
  if (autoEnableCaptions()) {
    console.log('Meeting Take Note: Captions enabled, stopping observer.');
    observer.disconnect();
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

// Initial run
if (autoEnableCaptions()) {
  observer.disconnect();
} else {
  applyLock();
}

// --- Selection Logic ---
let isPicking = false;
let lastElement = null;

function highlightElement(e) {
  if (!isPicking) return;
  if (lastElement) lastElement.classList.remove('meeting-note-picker-highlight');
  lastElement = e.target;
  lastElement.classList.add('meeting-note-picker-highlight');
  e.stopPropagation();
  e.preventDefault();
}

function captureElement(e) {
  if (!isPicking) return;
  e.preventDefault();
  e.stopPropagation();
  const rawHtml = e.target.innerHTML || '';
  chrome.runtime.sendMessage({ action: "manual_picked_html", html: rawHtml });
  stopPicking();
}

function handleEscape(e) {
  if (e.key === 'Escape') stopPicking();
}

function startPicking() {
  isPicking = true;
  document.addEventListener('mouseover', highlightElement, true);
  document.addEventListener('click', captureElement, true);
  document.addEventListener('keydown', handleEscape, true);
  document.body.style.cursor = 'crosshair';
}

function stopPicking() {
  isPicking = false;
  if (lastElement) {
    lastElement.classList.remove('meeting-note-picker-highlight');
    lastElement = null;
  }
  document.removeEventListener('mouseover', highlightElement, true);
  document.removeEventListener('click', captureElement, true);
  document.removeEventListener('keydown', handleEscape, true);
  document.body.style.cursor = 'default';
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "start_picker") {
    startPicking();
    sendResponse({status: "started"});
  } else if (request.action === "get_quick_html") {
    const captionsElement = document.querySelector('div[aria-label="Captions"]');
    if (captionsElement) {
      sendResponse({success: true, html: captionsElement.innerHTML});
    } else {
      sendResponse({success: false, message: "Captions area not found!"});
    }
  }
});
