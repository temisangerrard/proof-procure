import { NextRequest, NextResponse } from "next/server";
import { verifyRegistrationResponse } from "@simplewebauthn/server";
import type { RegistrationResponseJSON } from "@simplewebauthn/server";
import { d1 } from "@/lib/db";
import { ensureUser, setAuthSessionCookie } from "@/lib/auth";
import { bytesToBase64Url, getWebAuthnConfig } from "@/lib/webauthn";

export async function POST(req: NextRequest) {
  const { email, response } = (await req.json()) as {
    email?: string;
    response?: RegistrationResponseJSON;
  };
  const normalizedEmail = email?.toLowerCase().trim();

  if (!normalizedEmail || !response) {
    return NextResponse.json({ error: "Email and passkey response required" }, { status: 400 });
  }

  const user = await ensureUser(normalizedEmail);
  const now = new Date().toISOString();
  const challenge = await d1.first<{ id: number; challenge: string }>(
    `SELECT id, challenge FROM passkey_challenges
     WHERE email = ? AND type = 'registration' AND used = 0 AND expires_at > ?
     ORDER BY created_at DESC LIMIT 1`,
    [user.email, now],
  );

  if (!challenge) {
    return NextResponse.json({ error: "Passkey setup expired. Try again." }, { status: 400 });
  }

  const { rpID, origin } = getWebAuthnConfig(req);
  const verification = await verifyRegistrationResponse({
    response,
    expectedChallenge: challenge.challenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
    requireUserVerification: false,
  });

  if (!verification.verified) {
    return NextResponse.json({ error: "Could not verify passkey" }, { status: 400 });
  }

  const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;
  await d1.batch([
    {
      sql: `INSERT INTO passkey_credentials
        (credential_id, user_id, public_key, counter, transports, device_type, backed_up)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
      params: [
        credential.id,
        user.id,
        bytesToBase64Url(credential.publicKey),
        credential.counter,
        credential.transports ? JSON.stringify(credential.transports) : null,
        credentialDeviceType,
        credentialBackedUp ? 1 : 0,
      ],
    },
    {
      sql: "UPDATE passkey_challenges SET used = 1 WHERE id = ?",
      params: [challenge.id],
    },
  ]);

  await setAuthSessionCookie(user.id);

  return NextResponse.json({ ok: true, user });
}
