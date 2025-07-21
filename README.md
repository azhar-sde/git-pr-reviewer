# GitHub PR Reviewer Adder Extension

A minimal Chrome/Edge extension to quickly add configured reviewers to a GitHub Pull Request (PR).

## Features
- Only enabled on GitHub PR pages.
- Enter a comma-separated list of reviewers in the popup.
- Click "Add Reviewers" to add them to the PR using the GitHub UI.

## Installation
1. Download or clone this repository.
2. Go to `chrome://extensions` (or `edge://extensions`).
3. Enable "Developer mode" (top right).
4. Click "Load unpacked" and select this folder.

## Usage
1. Navigate to a GitHub PR page (URL like `https://github.com/owner/repo/pull/123`).
2. Click the extension icon.
3. Enter GitHub usernames (comma-separated) in the input field.
4. Click "Add Reviewers".
5. The extension will open the reviewers dropdown and add each reviewer.

## Notes
- The extension is only active on PR pages.
- Reviewers must have permission to be added to the PR.
- The extension simulates user interaction with the GitHub UI (no API token required).

---

MIT License 
