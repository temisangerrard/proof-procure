import { NextResponse } from "next/server";
import { getCircleBrowserConfig } from "@/lib/circle-user-controlled";

export async function GET() {
  return NextResponse.json(getCircleBrowserConfig());
}
