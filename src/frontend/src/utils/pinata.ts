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
  statusCode?: number;
  responseBody?: string;
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
      let parsedError;
      try {
        parsedError = JSON.parse(errorText);
      } catch {
        parsedError = null;
      }

      return {
        success: false,
        error: `Upload failed: ${response.status}`,
        statusCode: response.status,
        responseBody: parsedError ? JSON.stringify(parsedError, null, 2) : errorText,
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
      const errorText = await response.text();
      let parsedError;
      try {
        parsedError = JSON.parse(errorText);
      } catch {
        parsedError = null;
      }

      return {
        success: false,
        error: `Upload failed: ${response.status}`,
        statusCode: response.status,
        responseBody: parsedError ? JSON.stringify(parsedError, null, 2) : errorText,
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
 * Uploads multiple files as a directory to Pinata IPFS
 * Returns a single directory CID that can be used to construct ipfs://<cid>/<filename> URIs
 * 
 * Each file must be appended with a relative path in the filename to create proper directory structure
 */
export async function uploadDirectoryToPinata(
  apiKey: string,
  files: Array<{ filename: string; blob: Blob }>
): Promise<PinataUploadResult> {
  try {
    const formData = new FormData();
    
    // Add all files to the form data with relative paths
    // Each file needs its own 'file' entry with the path in the filename
    files.forEach(({ filename, blob }) => {
      // Use the filename as the relative path within the directory
      formData.append('file', blob, filename);
    });

    // Add metadata to name the directory
    const metadata = JSON.stringify({
      name: 'collection-images',
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
      const errorText = await response.text();
      let parsedError;
      try {
        parsedError = JSON.parse(errorText);
      } catch {
        parsedError = null;
      }

      return {
        success: false,
        error: `Directory upload failed: ${response.status}`,
        statusCode: response.status,
        responseBody: parsedError ? JSON.stringify(parsedError, null, 2) : errorText,
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
