const reviewersInput = document.getElementById('reviewers');
const saveBtn = document.getElementById('saveBtn');
const updateBtn = document.getElementById('updateBtn');
const statusDiv = document.getElementById('status');

// Load reviewers from storage
chrome.storage.local.get(['reviewers'], (result) => {
  if (result.reviewers) {
    reviewersInput.value = result.reviewers.join(', ');
  }
});

// Save reviewers
saveBtn.addEventListener('click', () => {
  const reviewers = reviewersInput.value.split(',').map(r => r.trim()).filter(Boolean);
  chrome.storage.local.set({ reviewers }, () => {
    statusDiv.textContent = 'Reviewers saved!';
    setTimeout(() => statusDiv.textContent = '', 1500);
  });
});

// Check if current tab is a PR page
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const url = tabs[0].url || '';
  if (/https:\/\/github.com\/[^\/]+\/[^\/]+\/pull\//.test(url)) {
    updateBtn.disabled = false;
  } else {
    updateBtn.disabled = true;
    statusDiv.textContent = 'Not a PR page.';
  }
});

// Update PR with reviewers
updateBtn.addEventListener('click', () => {
  chrome.storage.local.get(['reviewers'], (result) => {
    const reviewers = result.reviewers || [];
    if (reviewers.length === 0) {
      statusDiv.textContent = 'No reviewers saved.';
      return;
    }
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'add_reviewers', reviewers });
      statusDiv.textContent = 'Adding reviewers...';
      setTimeout(() => statusDiv.textContent = '', 1500);
    });
  });
}); 