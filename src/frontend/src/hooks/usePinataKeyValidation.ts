import { useEffect, useRef, useState } from "react";
import { validatePinataKey } from "../utils/pinata";

export type ValidationStatus = "idle" | "checking" | "valid" | "invalid";

export interface UsePinataKeyValidationResult {
  status: ValidationStatus;
  message: string;
}

/**
 * Hook that automatically validates a Pinata JWT (secret access token) with debouncing
 */
export function usePinataKeyValidation(
  apiKey: string,
): UsePinataKeyValidationResult {
  const [status, setStatus] = useState<ValidationStatus>("idle");
  const [message, setMessage] = useState("");
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const abortController = useRef<AbortController | null>(null);

  useEffect(() => {
    // Clear any pending validation
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    if (abortController.current) {
      abortController.current.abort();
    }

    // Reset to idle if key is empty
    if (!apiKey || apiKey.trim().length === 0) {
      setStatus("idle");
      setMessage("");
      return;
    }

    // Debounce validation
    debounceTimer.current = setTimeout(async () => {
      setStatus("checking");
      setMessage("Validating JWT token...");

      abortController.current = new AbortController();

      try {
        const result = await validatePinataKey(apiKey);

        if (result.valid) {
          setStatus("valid");
          setMessage(result.message);
        } else {
          setStatus("invalid");
          setMessage(result.message);
        }
      } catch (_error) {
        setStatus("invalid");
        setMessage("Could not validate JWT token");
      }
    }, 800);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, [apiKey]);

  return { status, message };
}
