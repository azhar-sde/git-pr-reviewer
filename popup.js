const reviewersTextarea = document.getElementById('reviewers');
const saveBtn = document.getElementById('saveBtn');
const addBtn = document.getElementById('addBtn');
const statusDiv = document.getElementById('status');

// Load reviewers from storage
chrome.storage.local.get(['reviewers'], (result) => {
  if (result.reviewers) {
    reviewersTextarea.value = result.reviewers.join(', ');
  }
});

// Save reviewers
saveBtn.addEventListener('click', () => {
  const reviewers = reviewersTextarea.value.split(',').map(r => r.trim()).filter(Boolean);
  chrome.storage.local.set({ reviewers }, () => {
    statusDiv.textContent = 'Reviewers saved!';
    setTimeout(() => statusDiv.textContent = '', 2000);
  });
});

// Add reviewers to PR
addBtn.addEventListener('click', () => {
  chrome.storage.local.get(['reviewers'], (result) => {
    const reviewers = result.reviewers || [];
    if (reviewers.length === 0) {
      statusDiv.textContent = 'No reviewers saved to add.';
      return;
    }
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        function: addReviewersToPR,
        args: [reviewers],
      });
      statusDiv.textContent = 'Adding reviewers...';
      setTimeout(() => statusDiv.textContent = '', 2000);
    });
  });
});

// This function will be injected into the page
function addReviewersToPR(reviewers) {
  const addReviewersButton = document.querySelector('summary[aria-label="Add reviewers"]');
  if (!addReviewersButton) {
    alert('Could not find the add reviewers button.');
    return;
  }
  addReviewersButton.click();

  setTimeout(() => {
    const input = document.getElementById('review-filter-field');
    if (!input) {
      alert('Could not find the reviewer filter input.');
      return;
    }

    for (const reviewer of reviewers) {
      input.value = reviewer;
      input.dispatchEvent(new Event('input', { bubbles: true }));

      setTimeout(() => {
        const userOption = document.querySelector(`[data-user-id][role="option"]`);
        if (userOption) {
          userOption.click();
        }
      }, 500);
    }

    setTimeout(() => {
      addReviewersButton.click(); // Close the dropdown
    }, 1000);
  }, 500);
}