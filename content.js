let lockCaptionsEnabled = false;
let captionsAutoEnabled = false;
let leaveListenerAdded = false;

// Load initial settings
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
  if (captionsAutoEnabled) return true;
  const turnOnButton = document.querySelector('button[aria-label="Turn on captions"], [aria-label="Turn on captions (c)"]');
  if (turnOnButton) {
    turnOnButton.click();
    captionsAutoEnabled = true;
    setTimeout(applyLock, 500);
    return true;
  }
  return false;
}

async function saveToHistory(text) {
  const result = await chrome.storage.local.get(['history']);
  const history = result.history || [];
  const newEntry = {
    id: Date.now(),
    date: new Date().toISOString(),
    text: text
  };
  history.unshift(newEntry);
  if (history.length > 10) history.pop();
  await chrome.storage.local.set({ history });
}

async function autoCopyOnLeave() {
  const captionsElement = document.querySelector('div[aria-label="Captions"]');
  if (!captionsElement) return;

  const html = captionsElement.innerHTML;
  
  chrome.storage.local.get(['currentLang', 'prompt_en', 'prompt_vi'], async (result) => {
    const lang = result.currentLang || 'en';
    const template = result[`prompt_${lang}`] || (lang === 'en' ? 
      "Please summarize the following meeting notes (provided in HTML format) and extract key action items:\n\n---\n{{text}}\n---" : 
      "Hãy tóm tắt các ghi chú cuộc họp sau (định dạng HTML) và trích xuất các mục hành động chính:\n\n---\n{{text}}\n---");
    
    let finalPrompt = '';
    if (template.includes('{{text}}')) {
      finalPrompt = template.replace('{{text}}', html);
    } else {
      finalPrompt = template + "\n\n" + html;
    }

    chrome.storage.local.set({ 
      lastMeetingNote: finalPrompt,
      lastMeetingDate: new Date().toISOString()
    });
    
    await saveToHistory(finalPrompt);

    try {
      await navigator.clipboard.writeText(finalPrompt);
    } catch (err) {
      // Silently fail in production
    }
  });
}

function setupLeaveButtonListener() {
  if (leaveListenerAdded) return true;
  const leaveBtn = document.querySelector('button[aria-label="Leave call"]');
  if (leaveBtn) {
    leaveBtn.addEventListener('click', autoCopyOnLeave);
    leaveListenerAdded = true;
    return true;
  }
  return false;
}

window.addEventListener('beforeunload', async () => {
  const captionsElement = document.querySelector('div[aria-label="Captions"]');
  if (!captionsElement) return;

  const html = captionsElement.innerHTML;
  chrome.storage.local.get(['currentLang', 'prompt_en', 'prompt_vi'], async (result) => {
    const lang = result.currentLang || 'en';
    const template = result[`prompt_${lang}`] || (lang === 'en' ? 
      "Please summarize the following meeting notes (provided in HTML format) and extract key action items:\n\n---\n{{text}}\n---" : 
      "Hãy tóm tắt các ghi chú cuộc họp sau (định dạng HTML) và trích xuất các mục hành động chính:\n\n---\n{{text}}\n---");
    
    let finalPrompt = '';
    if (template.includes('{{text}}')) {
      finalPrompt = template.replace('{{text}}', html);
    } else {
      finalPrompt = template + "\n\n" + html;
    }

    chrome.storage.local.set({ 
      lastMeetingNote: finalPrompt,
      lastMeetingDate: new Date().toISOString()
    });

    await saveToHistory(finalPrompt);
  });
});

let timeoutId = null;
const observer = new MutationObserver(() => {
  if (timeoutId) return;
  
  timeoutId = setTimeout(() => {
    const capsDone = autoEnableCaptions();
    const leaveDone = setupLeaveButtonListener();
    
    if (capsDone && leaveDone) {
      observer.disconnect();
    }
    
    timeoutId = null;
  }, 500);
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

autoEnableCaptions();
setupLeaveButtonListener();
applyLock();

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
