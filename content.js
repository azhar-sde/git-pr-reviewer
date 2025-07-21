chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'add_reviewers' && Array.isArray(msg.reviewers)) {
    addReviewers(msg.reviewers);
  }
});

async function addReviewers(reviewers) {
  // Find the reviewers button ("gear" or "reviewers" button)
  const btn = document.querySelector('[aria-label="Select reviewers"]') ||
    document.querySelector('summary[aria-label="Add reviewers"]');
  if (!btn) return alert('Reviewers UI not found.');
  btn.click();
  await new Promise(r => setTimeout(r, 300));
  const input = document.querySelector('input#review-filter-field');
  if (!input) return alert('Reviewer input not found.');
  for (const reviewer of reviewers) {
    input.value = reviewer;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await new Promise(r => setTimeout(r, 400));
    // Select the first suggestion
    const menuItem = document.querySelector('form[aria-label="Request a review"] [role="option"]');
    if (menuItem) menuItem.click();
    await new Promise(r => setTimeout(r, 300));
  }
  // Close the reviewers dropdown
  document.body.click();
} 