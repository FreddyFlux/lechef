import imageCompression from "browser-image-compression";

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB before compression
const MAX_FILE_SIZE_AFTER_COMPRESSION = 500 * 1024; // 500KB after compression
const MAX_WIDTH = 1200;
const COMPRESSION_QUALITY = 0.7;
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

/**
 * Validates image file before processing
 */
export function validateImageFile(file: File): ImageValidationResult {
  // Check file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: "Invalid file type. Please upload a JPEG, PNG, or WebP image.",
    };
  }

  // Check file size (before compression)
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File is too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB.`,
    };
  }

  return { valid: true };
}

/**
 * Compresses and resizes an image file
 * Returns a compressed Blob ready for upload
 */
export async function compressImage(file: File): Promise<Blob> {
  const options = {
    maxSizeMB: MAX_FILE_SIZE_AFTER_COMPRESSION / 1024 / 1024, // Convert to MB
    maxWidthOrHeight: MAX_WIDTH,
    useWebWorker: true,
    fileType: file.type,
    initialQuality: COMPRESSION_QUALITY,
  };

  try {
    const compressedFile = await imageCompression(file, options);
    
    // Double-check the size after compression
    if (compressedFile.size > MAX_FILE_SIZE_AFTER_COMPRESSION) {
      // If still too large, compress more aggressively
      const moreAggressiveOptions = {
        ...options,
        initialQuality: 0.5,
        maxSizeMB: MAX_FILE_SIZE_AFTER_COMPRESSION / 1024 / 1024,
      };
      const moreCompressed = await imageCompression(file, moreAggressiveOptions);
      return moreCompressed;
    }

    return compressedFile;
  } catch (error) {
    throw new Error(
      `Failed to compress image: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Processes an image file: validates, compresses, and returns as Blob
 */
export async function processImageFile(file: File): Promise<Blob> {
  // Validate first
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error || "Image validation failed");
  }

  // Compress and resize
  return await compressImage(file);
}

