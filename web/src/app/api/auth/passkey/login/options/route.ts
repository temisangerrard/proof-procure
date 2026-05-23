import { NextRequest, NextResponse } from "next/server";
import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { d1 } from "@/lib/db";
import { getWebAuthnConfig } from "@/lib/webauthn";

export async function POST(req: NextRequest) {
  const { email } = (await req.json()) as { email?: string };
  const normalizedEmail = email?.toLowerCase().trim();

  if (!normalizedEmail) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  const credentials = await d1.query<{ credential_id: string; transports: string | null }>(
    `SELECT pc.credential_id, pc.transports
     FROM passkey_credentials pc
     JOIN users u ON u.id = pc.user_id
     WHERE u.email = ?`,
    [normalizedEmail],
  );

  if (credentials.results.length === 0) {
    return NextResponse.json({ error: "No passkey is registered for this email" }, { status: 404 });
  }

  const { rpID } = getWebAuthnConfig(req);
  const options = await generateAuthenticationOptions({
    rpID,
    allowCredentials: credentials.results.map((credential) => ({
      id: credential.credential_id,
      transports: credential.transports ? JSON.parse(credential.transports) : undefined,
    })),
    userVerification: "preferred",
  });

  await d1.run(
    "INSERT INTO passkey_challenges (email, challenge, type, expires_at) VALUES (?, ?, 'authentication', ?)",
    [normalizedEmail, options.challenge, new Date(Date.now() + 5 * 60 * 1000).toISOString()],
  );

  return NextResponse.json(options);
}
