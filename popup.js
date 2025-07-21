document.getElementById('addBtn').addEventListener('click', async () => {
  const reviewers = document.getElementById('reviewers').value
    .split(',')
    .map(r => r.trim())
    .filter(Boolean);
  if (reviewers.length === 0) return;
  // Send reviewers to content script
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { action: 'add_reviewers', reviewers });
  });
}); 