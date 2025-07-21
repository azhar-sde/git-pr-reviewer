chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'add_reviewers' && Array.isArray(msg.reviewers)) {
    addReviewers(msg.reviewers);
  }
});

async function addReviewers(reviewers) {
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
  document.body.click();
}
