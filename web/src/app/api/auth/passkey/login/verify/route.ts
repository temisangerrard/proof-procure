import { NextRequest, NextResponse } from "next/server";
import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import type { AuthenticationResponseJSON } from "@simplewebauthn/server";
import { d1 } from "@/lib/db";
import { setAuthSessionCookie } from "@/lib/auth";
import { base64UrlToBytes, getWebAuthnConfig } from "@/lib/webauthn";

export async function POST(req: NextRequest) {
  const { email, response } = (await req.json()) as {
    email?: string;
    response?: AuthenticationResponseJSON;
  };
  const normalizedEmail = email?.toLowerCase().trim();

  if (!normalizedEmail || !response?.id) {
    return NextResponse.json({ error: "Email and passkey response required" }, { status: 400 });
  }

  const record = await d1.first<{
    credential_id: string;
    user_id: string;
    public_key: string;
    counter: number;
    transports: string | null;
    email: string;
    role: string;
  }>(
    `SELECT pc.credential_id, pc.user_id, pc.public_key, pc.counter, pc.transports, u.email, u.role
     FROM passkey_credentials pc
     JOIN users u ON u.id = pc.user_id
     WHERE pc.credential_id = ? AND u.email = ?`,
    [response.id, normalizedEmail],
  );

  if (!record) {
    return NextResponse.json({ error: "Passkey not found for this account" }, { status: 404 });
  }

  const now = new Date().toISOString();
  const challenge = await d1.first<{ id: number; challenge: string }>(
    `SELECT id, challenge FROM passkey_challenges
     WHERE email = ? AND type = 'authentication' AND used = 0 AND expires_at > ?
     ORDER BY created_at DESC LIMIT 1`,
    [normalizedEmail, now],
  );

  if (!challenge) {
    return NextResponse.json({ error: "Sign-in expired. Try again." }, { status: 400 });
  }

  const { rpID, origin } = getWebAuthnConfig(req);
  const verification = await verifyAuthenticationResponse({
    response,
    expectedChallenge: challenge.challenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
    credential: {
      id: record.credential_id,
      publicKey: base64UrlToBytes(record.public_key),
      counter: record.counter,
      transports: record.transports ? JSON.parse(record.transports) : undefined,
    },
    requireUserVerification: false,
  });

  if (!verification.verified) {
    return NextResponse.json({ error: "Could not verify passkey" }, { status: 400 });
  }

  await d1.batch([
    {
      sql: "UPDATE passkey_credentials SET counter = ?, last_used_at = datetime('now') WHERE credential_id = ?",
      params: [verification.authenticationInfo.newCounter, record.credential_id],
    },
    {
      sql: "UPDATE passkey_challenges SET used = 1 WHERE id = ?",
      params: [challenge.id],
    },
  ]);

  const user = { id: record.user_id, email: record.email, role: record.role };
  await setAuthSessionCookie(record.user_id);

  return NextResponse.json({ ok: true, user });
}
