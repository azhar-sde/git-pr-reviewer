chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'add_reviewers' && Array.isArray(msg.reviewers)) {
    addReviewers(msg.reviewers);
  }
});

async function addReviewers(reviewers) {
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

    const addReviewersButton = document.querySelector('summary[aria-label="Add reviewers"], summary[aria-label="Select reviewers"]');
    if (!addReviewersButton) {
        return alert('Could not find the "Add reviewers" or "Select reviewers" button. GitHub UI might have changed.');
    }
    addReviewersButton.click();
    console.log('Clicked the add/select reviewers button.');

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
                    const usernameElement = item.querySelector('.text-bold');
                    if (usernameElement && usernameElement.textContent.trim().toLowerCase() === reviewer.toLowerCase()) {
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

        const closeBtn = document.querySelector('summary[aria-label="Add reviewers"], summary[aria-label="Select reviewers"]');
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