import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { requestCircleEmailOtp } from "@/lib/circle-user-controlled";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as Record<string, unknown>;
  const deviceId = String(body.deviceId || "");
  const email = String(body.email || user.email);
  if (!deviceId)
    return NextResponse.json({ error: "Missing deviceId" }, { status: 400 });

  try {
    const data = await requestCircleEmailOtp({ deviceId, email });
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not send code" },
      { status: 400 },
    );
  }
}
