/**
 * File upload security utilities.
 * Validates file type, size, and generates safe filenames.
 */

const ALLOWED_MIME_TYPES: Record<string, string[]> = {
  pdf: ["application/pdf"],
  png: ["image/png"],
  jpg: ["image/jpeg"],
  jpeg: ["image/jpeg"],
};

const ALLOWED_EXTENSIONS = Object.keys(ALLOWED_MIME_TYPES);
const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  sanitizedName?: string;
}

/**
 * Validates a file before upload.
 */
export function validateFileUpload(file: File): FileValidationResult {
  // Check size
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File size exceeds ${MAX_FILE_SIZE_MB}MB limit (${(file.size / 1024 / 1024).toFixed(1)}MB)`,
    };
  }

  // Check extension
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return {
      valid: false,
      error: `File type ".${ext}" is not allowed. Accepted: ${ALLOWED_EXTENSIONS.join(", ")}`,
    };
  }

  // Check MIME type
  const allowedMimes = ALLOWED_MIME_TYPES[ext] ?? [];
  if (!allowedMimes.includes(file.type)) {
    return {
      valid: false,
      error: `File MIME type "${file.type}" does not match extension ".${ext}"`,
    };
  }

  // Check for double extensions (e.g., file.pdf.exe)
  const parts = file.name.split(".");
  if (parts.length > 2) {
    return {
      valid: false,
      error: "Files with multiple extensions are not allowed",
    };
  }

  // Generate sanitized filename
  const sanitizedName = generateSafeFilename(ext);

  return { valid: true, sanitizedName };
}

/**
 * Generates a randomized, safe filename.
 */
function generateSafeFilename(extension: string): string {
  const timestamp = Date.now();
  const random = crypto.randomUUID().slice(0, 8);
  return `${timestamp}-${random}.${extension}`;
}

/**
 * Returns allowed file extensions for UI display.
 */
export function getAllowedExtensions(): string[] {
  return [...ALLOWED_EXTENSIONS];
}

/**
 * Returns max file size in MB.
 */
export function getMaxFileSizeMB(): number {
  return MAX_FILE_SIZE_MB;
}
