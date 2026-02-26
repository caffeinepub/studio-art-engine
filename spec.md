# Specification

## Summary
**Goal:** Fix the Vault NFT generator so that when any trait is an animated GIF, the output NFT is also an animated GIF with all layers correctly composited across frames.

**Planned changes:**
- In the Vault generator worker (`vaultGenerator.worker.ts`), detect animated GIF traits among the selected layers.
- Extract all frames from each animated GIF trait and synchronize frame counts by looping shorter animations to match the longest.
- Composite each frame by rendering all static trait layers as a fixed base plus the corresponding animated frame from each animated trait in the correct layer order.
- Encode and deliver the result as a single animated GIF (preserving frame delays) when any animated trait is present; static PNG output is unchanged when no animated traits are involved.
- Update `Vault.tsx` and ZIP export logic to save animated NFT outputs with a `.gif` extension instead of `.png`.
- Update IPFS/Pinata upload logic to use `image/gif` MIME type for animated NFTs and `image/png` for static ones.
- Ensure NFT metadata references the correct file extension matching the actual output format.

**User-visible outcome:** Users can add animated GIF traits in the Vault; generated NFTs that include those traits will be animated GIFs in the preview, in ZIP downloads (with `.gif` extension), and when uploaded to IPFS — while NFTs with only static traits continue to export as PNG without regression.
