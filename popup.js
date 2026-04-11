const DEFAULT_PROMPTS = {
  en: "Please summarize the following meeting notes (provided in HTML format) and extract key action items:\n\n---\n{{text}}\n---",
  vi: "Hãy tóm tắt các ghi chú cuộc họp sau (định dạng HTML) và trích xuất các mục hành động chính:\n\n---\n{{text}}\n---"
};

const promptInput = document.getElementById('promptInput');
const promptLabel = document.getElementById('promptLabel');
const status = document.getElementById('status');
const quickBtn = document.getElementById('quickCopy');
const manualBtn = document.getElementById('startPicker');
const lockCheckbox = document.getElementById('lockCaptions');
const tabs = document.querySelectorAll('.tab');
const lastMeetingContainer = document.getElementById('lastMeetingContainer');
const restoreLastBtn = document.getElementById('restoreLast');
const promptSection = document.getElementById('promptSection');
const historySection = document.getElementById('historySection');
const historyList = document.getElementById('historyList');
const clearHistoryBtn = document.getElementById('clearHistory');

let currentLang = 'en';

// Load initial state
chrome.storage.local.get(['currentLang', 'prompt_en', 'prompt_vi', 'lockCaptions', 'lastMeetingNote', 'lastMeetingDate'], (result) => {
  currentLang = result.currentLang || 'en';
  lockCheckbox.checked = !!result.lockCaptions;
  updateUI(currentLang, result);

  if (result.lastMeetingNote) {
    lastMeetingContainer.style.display = 'block';
    const dateStr = result.lastMeetingDate ? new Date(result.lastMeetingDate).toLocaleTimeString() : '';
    restoreLastBtn.innerText = `Restore Last Meeting (${dateStr})`;
  }
});

function updateUI(lang, data) {
  // Update tabs
  tabs.forEach(t => t.classList.toggle('active', t.dataset.lang === lang));
  
  if (lang === 'history') {
    promptSection.style.display = 'none';
    historySection.style.display = 'block';
    loadHistory();
  } else {
    promptSection.style.display = 'block';
    historySection.style.display = 'none';
    // Update label
    promptLabel.innerText = lang === 'en' ? 'Custom Prompt (EN):' : 'Custom Prompt (VI):';
    // Load saved prompt for this language
    const savedKey = `prompt_${lang}`;
    promptInput.value = data[savedKey] || DEFAULT_PROMPTS[lang];
  }
}

async function loadHistory() {
  const result = await chrome.storage.local.get(['history']);
  const history = result.history || [];
  
  if (history.length === 0) {
    historyList.innerHTML = '<p class="hint" style="text-align: center; margin-top: 20px;">No history yet.</p>';
    return;
  }

  historyList.innerHTML = '';
  history.forEach(item => {
    const div = document.createElement('div');
    div.className = 'history-item';
    const date = new Date(item.date).toLocaleString();
    const preview = item.text.substring(0, 100).replace(/<[^>]*>/g, '') + '...';
    
    div.innerHTML = `
      <div class="history-date">${date}</div>
      <div class="history-preview">${preview}</div>
    `;
    
    div.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(item.text);
        status.innerText = "Copied history to clipboard!";
        setTimeout(() => status.innerText = "", 2000);
      } catch (err) {
        status.innerText = "Copy failed.";
      }
    });
    historyList.appendChild(div);
  });
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

clearHistoryBtn.addEventListener('click', async () => {
  if (confirm('Clear all history?')) {
    await chrome.storage.local.remove('history');
    loadHistory();
  }
});

// Language/Tab Switcher
tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const newLang = tab.dataset.lang;
    if (newLang === currentLang && newLang !== 'history') return;
    
    currentLang = newLang;
    if (newLang !== 'history') {
      chrome.storage.local.set({ currentLang });
    }
    
    // Refresh UI
    chrome.storage.local.get(['prompt_en', 'prompt_vi'], (result) => {
      updateUI(currentLang, result);
    });
  });
});

// Save prompt on change
promptInput.addEventListener('input', () => {
  if (currentLang === 'history') return;
  const saveKey = `prompt_${currentLang}`;
  chrome.storage.local.set({ [saveKey]: promptInput.value });
});

// Save lock setting
lockCheckbox.addEventListener('change', () => {
  chrome.storage.local.set({ lockCaptions: lockCheckbox.checked });
});

restoreLastBtn.addEventListener('click', async () => {
  chrome.storage.local.get(['lastMeetingNote'], async (result) => {
    if (result.lastMeetingNote) {
      try {
        await navigator.clipboard.writeText(result.lastMeetingNote);
        status.innerText = "Restored and copied to clipboard!";
        saveToHistory(result.lastMeetingNote);
        setTimeout(() => window.close(), 1000);
      } catch (err) {
        console.error('Restore failed: ', err);
        status.innerText = "Restore failed.";
      }
    }
  });
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
    saveToHistory(finalPrompt);
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
