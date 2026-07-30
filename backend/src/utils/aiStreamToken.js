import jwt from "jsonwebtoken";
import ErrorHandler from "./ErrorHandler.js";

// Browsers connect to the AI service directly, so they cannot hold the static
// service key. Instead the API mints a short-lived, narrowly scoped token once
// it has authorised the request, and the AI service verifies it.
//
// This is deliberately signed with its own secret rather than JWT_SECRET_KEY:
// the AI service is the more exposed component, and a compromise there must not
// let an attacker mint full session tokens.
const STREAM_SCOPE = "ai-stream";
const TTL_SECONDS = 120;

export const createAiStreamToken = ({ userId, cameraId = null }) => {
  const secret = process.env.AI_STREAM_TOKEN_SECRET;
  if (!secret) {
    throw new ErrorHandler("AI stream authentication is not configured", 503);
  }

  const token = jwt.sign(
    {
      sub: String(userId),
      scope: STREAM_SCOPE,
      camera: cameraId ? String(cameraId) : null,
    },
    secret,
    { expiresIn: TTL_SECONDS }
  );

  return { token, expiresInSeconds: TTL_SECONDS };
};
