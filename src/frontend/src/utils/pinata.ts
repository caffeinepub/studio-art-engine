/**
 * Pinata API helper for validating JWT tokens and uploading to IPFS
 */

export interface PinataValidationResult {
  valid: boolean;
  message: string;
}

export interface PinataUploadResult {
  success: boolean;
  cid?: string;
  error?: string;
}

/**
 * Validates a Pinata JWT (secret access token) by making a test request
 */
export async function validatePinataKey(apiKey: string): Promise<PinataValidationResult> {
  if (!apiKey || apiKey.trim().length === 0) {
    return {
      valid: false,
      message: 'Please enter your JWT token',
    };
  }

  try {
    const response = await fetch('https://api.pinata.cloud/data/testAuthentication', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (response.ok) {
      return {
        valid: true,
        message: 'JWT token is valid',
      };
    } else if (response.status === 401) {
      return {
        valid: false,
        message: 'This JWT token is not valid',
      };
    } else {
      return {
        valid: false,
        message: 'Could not validate JWT token',
      };
    }
  } catch (error) {
    return {
      valid: false,
      message: 'Could not connect to Pinata',
    };
  }
}

/**
 * Uploads a file to Pinata IPFS using JWT Bearer token
 */
export async function uploadToPinata(
  apiKey: string,
  file: File | Blob,
  filename: string
): Promise<PinataUploadResult> {
  try {
    const formData = new FormData();
    formData.append('file', file, filename);

    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `Upload failed: ${response.status}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      cid: data.IpfsHash,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}

/**
 * Uploads JSON metadata to Pinata IPFS using JWT Bearer token
 */
export async function uploadJSONToPinata(
  apiKey: string,
  jsonData: any,
  filename: string
): Promise<PinataUploadResult> {
  try {
    const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pinataContent: jsonData,
        pinataMetadata: {
          name: filename,
        },
      }),
    });

    if (!response.ok) {
      return {
        success: false,
        error: `Upload failed: ${response.status}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      cid: data.IpfsHash,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}

/**
 * Sanitizes a filename to a relative path by removing absolute path segments
 * and normalizing to forward slashes
 */
function sanitizeFilename(filename: string): string {
  // Remove any absolute path indicators (C:\, /Users/, etc.)
  let sanitized = filename.replace(/^[A-Za-z]:\\/, ''); // Windows absolute paths
  sanitized = sanitized.replace(/^\/[^/]+\//, ''); // Unix-style absolute paths
  sanitized = sanitized.replace(/^\.\//, ''); // Relative ./ prefix
  sanitized = sanitized.replace(/^\.\.\//, ''); // Relative ../ prefix
  
  // Normalize to forward slashes
  sanitized = sanitized.replace(/\\/g, '/');
  
  // Extract just the basename if it still contains path separators
  const parts = sanitized.split('/');
  return parts[parts.length - 1];
}

/**
 * Uploads multiple files as a directory to Pinata IPFS
 * Returns a single directory CID that can be used to construct ipfs://<cid>/<filename> URIs
 * 
 * @param apiKey - Pinata JWT Bearer token
 * @param files - Array of files with filenames and blobs
 * @param folderPrefix - Folder name to prefix all files with (e.g., "images", "metadata")
 */
export async function uploadDirectoryToPinata(
  apiKey: string,
  files: Array<{ filename: string; blob: Blob }>,
  folderPrefix: string
): Promise<PinataUploadResult> {
  try {
    const formData = new FormData();
    
    // Add all files to the form data with sanitized relative paths
    files.forEach(({ filename, blob }) => {
      // Sanitize the filename to remove any absolute path segments
      const sanitizedBasename = sanitizeFilename(filename);
      
      // Construct the relative path with folder prefix
      const relativePath = `${folderPrefix}/${sanitizedBasename}`;
      
      // Append to FormData with the relative path as the multipart filename
      formData.append('file', blob, relativePath);
    });

    // Add metadata to name the directory
    const metadata = JSON.stringify({
      name: `${folderPrefix}-directory`,
    });
    formData.append('pinataMetadata', metadata);

    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      return {
        success: false,
        error: `Directory upload failed: ${response.status}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      cid: data.IpfsHash,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Directory upload failed',
    };
  }
}
