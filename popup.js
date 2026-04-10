const DEFAULT_PROMPTS = {
  en: "Please summarize the following meeting notes (provided in HTML format) and extract key action items:\n\n---\n{{text}}\n---",
  vi: "Hãy tóm tắt các ghi chú cuộc họp sau (định dạng HTML) và trích xuất các mục hành động chính:\n\n---\n{{text}}\n---"
};

const promptInput = document.getElementById('promptInput');
const promptLabel = document.getElementById('promptLabel');
const status = document.getElementById('status');
const quickBtn = document.getElementById('quickCopy');
const manualBtn = document.getElementById('startPicker');
const tabs = document.querySelectorAll('.tab');

let currentLang = 'en';

// Load initial state
chrome.storage.local.get(['currentLang', 'prompt_en', 'prompt_vi'], (result) => {
  currentLang = result.currentLang || 'en';
  updateUI(currentLang, result);
});

function updateUI(lang, data) {
  // Update tabs
  tabs.forEach(t => t.classList.toggle('active', t.dataset.lang === lang));
  
  // Update label
  promptLabel.innerText = lang === 'en' ? 'Custom Prompt (EN):' : 'Custom Prompt (VI):';
  
  // Load saved prompt for this language
  const savedKey = `prompt_${lang}`;
  promptInput.value = data[savedKey] || DEFAULT_PROMPTS[lang];
}

// Language Switcher
tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const newLang = tab.dataset.lang;
    if (newLang === currentLang) return;
    
    currentLang = newLang;
    chrome.storage.local.set({ currentLang });
    
    // Refresh UI with data for new language
    chrome.storage.local.get(['prompt_en', 'prompt_vi'], (result) => {
      updateUI(currentLang, result);
    });
  });
});

// Save prompt on change
promptInput.addEventListener('input', () => {
  const saveKey = `prompt_${currentLang}`;
  chrome.storage.local.set({ [saveKey]: promptInput.value });
});

async function copyToClipboard(html) {
  const template = promptInput.value;
  let finalPrompt = '';

  if (template.includes('{{text}}')) {
    finalPrompt = template.replace('{{text}}', html);
  } else {
    finalPrompt = template + "\n\n" + html;
  }

  try {
    await navigator.clipboard.writeText(finalPrompt);
    status.innerText = "Copied to clipboard!";
    setTimeout(() => window.close(), 1000);
  } catch (err) {
    console.error('Copy failed: ', err);
    status.innerText = "Copy failed. Try again.";
  }
}

quickBtn.addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab.url.includes('meet.google.com')) {
    chrome.tabs.sendMessage(tab.id, { action: "get_quick_html" }, (response) => {
      if (chrome.runtime.lastError) status.innerText = "Error: Refresh the page.";
      else if (response?.success) copyToClipboard(response.html);
      else status.innerText = response?.message || "Captions not found.";
    });
  } else {
    status.innerText = "Only works on Google Meet!";
  }
});

manualBtn.addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab.url.includes('meet.google.com')) {
    chrome.tabs.sendMessage(tab.id, { action: "start_picker" }, (response) => {
      if (chrome.runtime.lastError) status.innerText = "Error: Refresh the page.";
      else status.innerText = "Select caption area...";
    });
  } else {
    status.innerText = "Only works on Google Meet!";
  }
});

chrome.runtime.onMessage.addListener((message) => {
  if (message.action === "manual_picked_html") {
    copyToClipboard(message.html);
  }
});
