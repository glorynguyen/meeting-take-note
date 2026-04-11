# Meeting Take Note 📝

A lightweight Chrome Extension designed to streamline the process of capturing and formatting Google Meet captions for processing with Large Language Models (LLMs) like ChatGPT, Claude, or Gemini.

## 🚀 Features

- **Auto-Enable Captions:** Automatically clicks the "Turn on captions" button as soon as you join a meeting.
- **Lock Captions:** Prevents accidental deactivation by disabling the "Turn off captions" button in the Google Meet interface.
- **Quick Copy:** One-click extraction of current meeting captions.
- **Auto-Copy & Restore:** Automatically captures captions when you click "Leave call" and allows restoring the last session from the popup if you forget to copy.
- **Manual Select:** Precisely choose which parts of the meeting history to capture.
- **Custom Prompts:** Pre-configure prompts in both English and Vietnamese to automatically wrap your captured text.
- **Dynamic Template:** Use the `{{text}}` placeholder in your prompts to define exactly where the captions should be inserted.
- **Auto-Formatting:** Captures HTML structure to preserve speaker context for better LLM understanding.

## 🛠 Installation

Since this extension is in development, you can install it manually:

1.  **Download/Clone** this repository to your local machine.
2.  Open Chrome and navigate to `chrome://extensions/`.
3.  Enable **"Developer mode"** in the top right corner.
4.  Click **"Load unpacked"** and select the folder containing the extension files.

## 📖 How to Use

1.  Start or join a **Google Meet** call.
2.  The extension will **automatically enable captions** for you (if not already active).
3.  Open the **Meeting Take Note** popup from your browser toolbar.
4.  (Optional) Check **"Lock Captions"** to ensure they stay on during the entire meeting.
5.  Choose your language (EN/VI) and click **Quick Copy** or **Manual Select**.
6.  The formatted prompt + captions are now in your clipboard—just paste them into your favorite LLM!

## 🔧 Configuration

The extension supports template-based prompts. By default:
- **English:** `Please summarize the following meeting notes...`
- **Vietnamese:** `Hãy tóm tắt các ghi chú cuộc họp sau...`

You can edit these directly in the popup, and they will be saved automatically for future use.

## 🔒 Privacy

This extension runs entirely locally in your browser. It does not send your meeting data to any external servers. Your captions only leave your browser when you manually paste them into another application.

---

*Made to make meetings more productive.*
