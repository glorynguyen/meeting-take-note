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
