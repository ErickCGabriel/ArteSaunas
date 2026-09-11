import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/current-user";
import { exchangeCodeForConnection } from "@/lib/google/calendar";
import { saveGoogleConnection } from "@/lib/google/settings";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  const url = new URL("/calendario", request.url);

  if (!user || (user.role !== "admin" && user.role !== "gerente")) {
    return NextResponse.redirect(url);
  }

  const code = new URL(request.url).searchParams.get("code");
  if (!code) {
    url.searchParams.set("google_error", "no_code");
    return NextResponse.redirect(url);
  }

  try {
    const { refreshToken, email } = await exchangeCodeForConnection(code);
    await saveGoogleConnection(refreshToken, email);
    url.searchParams.set("google_connected", "1");
  } catch (error) {
    console.error("Falha ao conectar Google Calendar:", error);
    url.searchParams.set("google_error", "exchange");
  }

  return NextResponse.redirect(url);
}
