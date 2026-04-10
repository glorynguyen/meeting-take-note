document.getElementById('startPicker').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  if (tab.url.includes('meet.google.com')) {
    chrome.tabs.sendMessage(tab.id, { action: "start_picker" }, (response) => {
      if (chrome.runtime.lastError) {
        document.getElementById('status').innerText = "Error: Refresh the page.";
        console.error(chrome.runtime.lastError);
      } else {
        document.getElementById('status').innerText = "Select caption area...";
        window.close(); // Close popup to let user pick
      }
    });
  } else {
    document.getElementById('status').innerText = "Only works on Google Meet!";
  }
});
