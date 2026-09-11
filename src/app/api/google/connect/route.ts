import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/current-user";
import { getGoogleAuthUrl } from "@/lib/google/calendar";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "gerente")) {
    return NextResponse.redirect(new URL("/calendario", request.url));
  }

  try {
    return NextResponse.redirect(getGoogleAuthUrl());
  } catch {
    const url = new URL("/calendario", request.url);
    url.searchParams.set("google_error", "config");
    return NextResponse.redirect(url);
  }
}
