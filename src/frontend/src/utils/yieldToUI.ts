/**
 * Yields execution back to the browser event loop to keep the UI responsive
 * during long-running operations.
 */
export async function yieldToUI(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      setTimeout(resolve, 0);
    });
  });
}
