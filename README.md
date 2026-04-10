# Meeting Take Note 📝

A lightweight Chrome Extension designed to streamline the process of capturing and formatting Google Meet captions for processing with Large Language Models (LLMs) like ChatGPT, Claude, or Gemini.

## 🚀 Features

- **Quick Copy:** One-click extraction of current meeting captions.
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
2.  **Enable Captions** in Google Meet (this is required for the extension to "see" the text).
3.  Click the **Meeting Take Note** icon in your browser toolbar.
4.  Choose your preferred language (EN/VI) and customize your prompt if needed.
5.  Click **Quick Copy** to grab everything or **Manual Select** to pick a specific area.
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
