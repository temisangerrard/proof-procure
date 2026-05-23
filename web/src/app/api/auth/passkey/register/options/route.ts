import { NextRequest, NextResponse } from "next/server";
import { generateRegistrationOptions } from "@simplewebauthn/server";
import { d1 } from "@/lib/db";
import { ensureUser } from "@/lib/auth";
import { getWebAuthnConfig, textToUserID } from "@/lib/webauthn";

export async function POST(req: NextRequest) {
  const { email } = (await req.json()) as { email?: string };
  const normalizedEmail = email?.toLowerCase().trim();

  if (!normalizedEmail) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  const user = await ensureUser(normalizedEmail);
  const { rpName, rpID } = getWebAuthnConfig(req);
  const credentials = await d1.query<{ credential_id: string; transports: string | null }>(
    "SELECT credential_id, transports FROM passkey_credentials WHERE user_id = ?",
    [user.id],
  );

  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userName: user.email,
    userID: textToUserID(user.id),
    userDisplayName: user.email,
    attestationType: "none",
    excludeCredentials: credentials.results.map((credential) => ({
      id: credential.credential_id,
      transports: credential.transports ? JSON.parse(credential.transports) : undefined,
    })),
    authenticatorSelection: {
      residentKey: "preferred",
      userVerification: "preferred",
    },
  });

  await d1.run(
    "INSERT INTO passkey_challenges (email, challenge, type, expires_at) VALUES (?, ?, 'registration', ?)",
    [user.email, options.challenge, new Date(Date.now() + 5 * 60 * 1000).toISOString()],
  );

  return NextResponse.json(options);
}
