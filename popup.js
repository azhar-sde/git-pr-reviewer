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
    const waitForElement = (selector, timeout = 5000) => {
        return new Promise((resolve, reject) => {
            const interval = 100;
            const endTime = Date.now() + timeout;
            const timer = setInterval(() => {
                const element = document.querySelector(selector);
                if (element) {
                    clearInterval(timer);
                    resolve(element);
                } else if (Date.now() > endTime) {
                    clearInterval(timer);
                    reject(new Error(`Element ${selector} not found within ${timeout}ms`));
                }
            }, interval);
        });
    };

    const btn = document.querySelector('[aria-label="Select reviewers"], summary[aria-label="Add reviewers"]');
    if (!btn) {
        return alert('Could not find the "Add reviewers" button. GitHub UI might have changed.');
    }
    btn.click();

    try {
        const input = await waitForElement('input#review-filter-field');

        for (const reviewer of reviewers) {
            input.value = reviewer;
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));

            const reviewerOptionSelector = `form[aria-label="Request a review"] [role="option"]`;
            
            try {
                await waitForElement(reviewerOptionSelector);
                
                const menuItems = document.querySelectorAll(reviewerOptionSelector);
                let foundAndClicked = false;
                for (const item of menuItems) {
                    const usernameElement = item.querySelector('.text-bold');
                    if (usernameElement && usernameElement.textContent.trim().toLowerCase() === reviewer.toLowerCase()) {
                        item.click();
                        foundAndClicked = true;
                        break;
                    }
                }

                if (!foundAndClicked) {
                    throw new Error(`Reviewer suggestion for "${reviewer}" did not appear or could not be matched.`);
                }

            } catch (error) {
                alert(`Could not find or select reviewer "${reviewer}". They may not be a valid collaborator or the UI may have changed.`);
                console.error(error);
            }
            
            input.value = '';
            input.dispatchEvent(new Event('input', { bubbles: true }));

            await new Promise(r => setTimeout(r, 200));
        }

        const closeBtn = document.querySelector('[aria-label="Select reviewers"], summary[aria-label="Add reviewers"]');
        if(closeBtn) closeBtn.click();
        else document.body.click();

    } catch (error) {
        alert('An error occurred while trying to add reviewers. The reviewer search input field might not have appeared.');
        console.error(error);
        document.body.click();
    }
}