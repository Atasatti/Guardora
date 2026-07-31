import AiLabClient from "./_components/AiLabClient";

// Evaluation runs proxy through this route's server actions. 300s is the
// platform ceiling on every plan; the API's own AI_LAB_TIMEOUT_MS (180s by
// default) expires first, so a slow model returns a real error rather than
// being terminated mid-request.
export const maxDuration = 300;

export default function AiLabPage() {
  return <AiLabClient />;
}
