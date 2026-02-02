/**
 * Audio Transcription Endpoint
 * 
 * Transcribes audio files using ElevenLabs Speech-to-Text API.
 * 
 * Security features:
 * - Rate limiting (10 requests/minute per IP)
 * - File size validation (max 10MB)
 * - Content type validation
 * - No sensitive data in logs
 * 
 * @see SECURITY.md for configuration details
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

import {
  getCorsHeaders,
  getResponseHeaders,
  checkRateLimit,
  getClientIP,
  rateLimitedResponse,
  errorResponse,
  successResponse,
  createAuditLog,
  logAudit,
} from "../_shared/security.ts";
import { RATE_LIMITS } from "../_shared/rate-limits.ts";

// Maximum file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Allowed audio MIME types
const ALLOWED_AUDIO_TYPES = [
  "audio/mpeg",
  "audio/mp3",
  "audio/mp4",
  "audio/wav",
  "audio/webm",
  "audio/ogg",
  "audio/x-m4a",
  "audio/m4a",
];

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: getCorsHeaders(req) });
  }

  const clientIP = getClientIP(req);

  try {
    // ========================================================================
    // RATE LIMITING
    // ========================================================================
    const rateLimitResult = checkRateLimit(clientIP, RATE_LIMITS.TRANSCRIBE);
    if (!rateLimitResult.allowed) {
      logAudit(createAuditLog(req, "transcribe_rate_limited", undefined, false, { ip: clientIP }));
      return rateLimitedResponse(req, rateLimitResult);
    }

    // ========================================================================
    // VALIDATE API KEY CONFIGURATION
    // ========================================================================
    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");

    if (!ELEVENLABS_API_KEY) {
      console.error("[SECURITY] ELEVENLABS_API_KEY is not configured");
      return errorResponse(req, 500, "Transcription service not configured");
    }

    // ========================================================================
    // INPUT VALIDATION
    // ========================================================================
    let formData: FormData;
    try {
      formData = await req.formData();
    } catch {
      return errorResponse(req, 400, "Invalid form data");
    }

    const audioFile = formData.get("audio") as File | null;

    if (!audioFile) {
      return errorResponse(req, 400, "No audio file provided");
    }

    // Validate file size
    if (audioFile.size > MAX_FILE_SIZE) {
      console.warn(`[Transcribe] File too large: ${audioFile.size} bytes`);
      return errorResponse(req, 400, "Audio file too large. Maximum size is 10MB.");
    }

    // Validate file size minimum
    if (audioFile.size < 100) {
      return errorResponse(req, 400, "Audio file is too small or empty.");
    }

    // Validate content type (if provided)
    if (audioFile.type && !ALLOWED_AUDIO_TYPES.includes(audioFile.type)) {
      console.warn(`[Transcribe] Invalid content type: ${audioFile.type}`);
      // Don't reject - some browsers send incorrect MIME types
    }

    console.log(`[Transcribe] Processing file: size=${audioFile.size}, type=${audioFile.type || "unknown"}`);

    // ========================================================================
    // CALL ELEVENLABS API
    // ========================================================================
    const apiFormData = new FormData();
    apiFormData.append("file", audioFile);
    apiFormData.append("model_id", "scribe_v2");
    apiFormData.append("language_code", "eng");

    const response = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
      method: "POST",
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY,
      },
      body: apiFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Transcribe] ElevenLabs API error:", response.status, errorText.slice(0, 200));
      logAudit(createAuditLog(req, "transcribe_api_error", undefined, false, { status: response.status }));
      return errorResponse(req, 500, "Transcription failed. Please try again.");
    }

    const transcription = await response.json();
    
    // Log success (without transcript content for privacy)
    logAudit(createAuditLog(req, "transcribe_success", undefined, true, { 
      transcriptLength: transcription.text?.length || 0 
    }));

    return successResponse(req, { transcript: transcription.text || "" });

  } catch (error) {
    console.error("[Transcribe] Unexpected error:", error instanceof Error ? error.message : "Unknown error");
    logAudit(createAuditLog(req, "transcribe_error", undefined, false));
    return errorResponse(req, 500, "Transcription failed. Please try again or type your request.");
  }
});
