let isPicking = false;
let lastElement = null;

function highlightElement(e) {
  if (!isPicking) return;
  
  if (lastElement) {
    lastElement.classList.remove('meeting-note-picker-highlight');
  }
  
  lastElement = e.target;
  lastElement.classList.add('meeting-note-picker-highlight');
  e.stopPropagation();
  e.preventDefault();
}

async function captureElement(e) {
  if (!isPicking) return;
  
  e.preventDefault();
  e.stopPropagation();
  
  const selectedElement = e.target;
  const rawText = selectedElement.innerText || '';
  
  const prompt = `Please summarize the following meeting notes and extract key action items:\n\n---\n${rawText}\n---`;
  
  try {
    await navigator.clipboard.writeText(prompt);
    alert('Prompt copied to clipboard!');
  } catch (err) {
    console.error('Failed to copy: ', err);
    alert('Failed to copy. Please try again.');
  }
  
  stopPicking();
}

function handleEscape(e) {
  if (e.key === 'Escape') {
    stopPicking();
  }
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
  }
});
