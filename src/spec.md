# Specification

## Summary
**Goal:** Eliminate header jitter caused by the save-status badge and make Vault publishing UI more space-efficient using tooltips and a compact status alert.

**Planned changes:**
- Stabilize the header save-status badge (“Saving…”, “Saved”) so it does not change header width/spacing or shift nav items when it appears/disappears, while keeping it positioned to the right of the project name on desktop and in the mobile menu project header.
- Update the Vault publishing controls to remove the always-visible instructional text block and replace it with hover tooltips on Lock, Unlock, and Upload buttons with the provided messages.
- Make the Vault publishing status alert (including “Uploaded successfully!” and the Metadata CID) more compact via reduced padding/typography while keeping all states readable and functional.

**User-visible outcome:** The header no longer shifts when save status changes, Vault publishing instructions appear as hover tooltips on the buttons instead of taking space, and the publishing status alert is shorter while still clearly showing status and CID.
