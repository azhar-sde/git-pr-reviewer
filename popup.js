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
async function addReviewersToPR(reviewers) {
    const btn = document.querySelector('[aria-label="Select reviewers"]') ||
                document.querySelector('summary[aria-label="Add reviewers"]');

    if (!btn) {
        alert('Could not find the "Add reviewers" button. GitHub UI might have changed.');
        return;
    }
    btn.click();

    await new Promise(r => setTimeout(r, 300));

    const input = document.querySelector('input#review-filter-field');
    if (!input) {
        alert('Could not find the reviewer search input field.');
        // try to close the dialog
        document.body.click();
        return;
    }

    for (const reviewer of reviewers) {
        input.value = reviewer;
        input.dispatchEvent(new Event('input', { bubbles: true }));

        await new Promise(r => setTimeout(r, 600)); // Wait for suggestions

        const menuItems = document.querySelectorAll('form[aria-label="Request a review"] [role="option"]');
        let found = false;
        for (const item of menuItems) {
            if (item.textContent.trim().toLowerCase().includes(reviewer.toLowerCase())) {
                item.click();
                found = true;
                break;
            }
        }

        if (!found) {
            alert(`Reviewer "${reviewer}" not found or not eligible.`);
        }

        await new Promise(r => setTimeout(r, 400));
    }

    // Click the body to close the menu
    document.body.click();
}
