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

async function addReviewersToPR(reviewers) {
    console.log('Starting to add reviewers:', reviewers);

    const waitForElement = (selector, timeout = 5000) => {
        console.log(`Waiting for element: ${selector}`);
        return new Promise((resolve, reject) => {
            const interval = 100;
            const endTime = Date.now() + timeout;
            const timer = setInterval(() => {
                const element = document.querySelector(selector);
                if (element) {
                    console.log(`Found element: ${selector}`);
                    clearInterval(timer);
                    resolve(element);
                } else if (Date.now() > endTime) {
                    clearInterval(timer);
                    console.error(`Element ${selector} not found within ${timeout}ms`);
                    reject(new Error(`Element ${selector} not found within ${timeout}ms`));
                }
            }, interval);
        });
    };

    const settingsButton = document.querySelector('#reviewers-select-menu button.discussion-sidebar-heading-action');
    if (!settingsButton) {
        return alert('Could not find the reviewers settings button (gear icon). GitHub UI might have changed.');
    }
    settingsButton.click();
    console.log('Clicked the reviewers settings button.');

    try {
        const input = await waitForElement('input#review-filter-field');
        console.log('Reviewer search input is ready.');

        for (const reviewer of reviewers) {
            console.log(`Processing reviewer: ${reviewer}`);
            input.value = reviewer;
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
            input.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, key: 'a' }));

            await new Promise(r => setTimeout(r, 1000));

            const reviewerOptionSelector = `form[aria-label="Request a review"] [role="option"]`;
            
            try {
                await waitForElement(reviewerOptionSelector, 3000);
                
                const menuItems = document.querySelectorAll(reviewerOptionSelector);
                console.log(`Found ${menuItems.length} potential reviewer options.`);
                let foundAndClicked = false;

                for (const item of menuItems) {
                    const itemText = item.textContent.trim().toLowerCase();
                    const reviewerLower = reviewer.toLowerCase();
                    if (itemText.includes(reviewerLower)) {
                        console.log(`Found matching option for "${reviewer}": "${item.textContent}"`);
                        item.click();
                        foundAndClicked = true;
                        break;
                    }
                }

                if (!foundAndClicked) {
                    throw new Error(`Reviewer suggestion for "${reviewer}" did not appear or could not be matched.`);
                }

            } catch (error) {
                alert(`Could not find or select reviewer "${reviewer}". They may not be a valid collaborator or the UI may have changed. Please check the browser console for more details.`);
                console.error(error);
            }
            
            input.value = '';
            input.dispatchEvent(new Event('input', { bubbles: true }));

            await new Promise(r => setTimeout(r, 300));
        }

        const closeBtn = document.querySelector('#reviewers-select-menu button.discussion-sidebar-heading-action');
        if(closeBtn) {
            closeBtn.click();
            console.log('Closed the reviewers dialog.');
        } else {
            document.body.click();
        }

    } catch (error) {
        alert('An error occurred while trying to add reviewers. The reviewer search input field might not have appeared. Please check the browser console for more details.');
        console.error(error);
        document.body.click();
    }
}
