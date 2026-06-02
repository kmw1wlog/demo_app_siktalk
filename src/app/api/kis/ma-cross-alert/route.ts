import { buildMaCrossAlert } from "@/lib/ma-cross-alert";
import { verifyKisCredentials } from "@/lib/kis";

export async function POST() {
  const credential = await verifyKisCredentials();
  const alert = buildMaCrossAlert({
    authenticated: credential.authenticated,
    credentialMessage: credential.message,
  });

  return Response.json({
    ok: true,
    mode: credential.authenticated ? "kis-paper" : process.env.KIS_MODE || "paper",
    credential,
    alert,
  });
}
