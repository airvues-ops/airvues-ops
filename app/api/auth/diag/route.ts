// Diagnostic endpoint for the auth+session state. Admin-only.
// Hit /api/auth/diag while signed in to see exactly what's on the session.
// REMOVE OR LOCK DOWN once calendar bug is resolved.

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "no session" }, { status: 401 });
  }
  if (session.user?.role !== "admin") {
    return NextResponse.json({ error: "admin only" }, { status: 403 });
  }

  const accessToken = session.accessToken;
  let calendarProbe: unknown = "skipped (no token)";
  if (accessToken) {
    try {
      const now = new Date();
      const max = new Date(now.getTime() + 7 * 86_400_000);
      const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?${new URLSearchParams(
        {
          timeMin: now.toISOString(),
          timeMax: max.toISOString(),
          singleEvents: "true",
          maxResults: "3",
          orderBy: "startTime",
        },
      )}`;
      const resp = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const body = await resp.text();
      calendarProbe = {
        status: resp.status,
        bodyPreview: body.slice(0, 600),
      };
    } catch (e) {
      calendarProbe = { error: (e as Error).message };
    }

    // Also probe Google's tokeninfo endpoint to see what scopes the token actually has
    try {
      const ti = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(accessToken)}`,
      );
      const tiBody = await ti.text();
      return NextResponse.json({
        user: {
          email: session.user.email,
          name: session.user.name,
          role: session.user.role,
        },
        accessTokenPresent: true,
        accessTokenSample: accessToken.slice(0, 12) + "…" + accessToken.slice(-6),
        accessTokenExpires: session.accessTokenExpires,
        tokenInfo: { status: ti.status, body: tiBody.slice(0, 800) },
        calendarProbe,
      });
    } catch (e) {
      return NextResponse.json({
        user: {
          email: session.user.email,
          name: session.user.name,
          role: session.user.role,
        },
        accessTokenPresent: true,
        accessTokenSample: accessToken.slice(0, 12) + "…" + accessToken.slice(-6),
        tokenInfoError: (e as Error).message,
        calendarProbe,
      });
    }
  }

  return NextResponse.json({
    user: {
      email: session.user.email,
      name: session.user.name,
      role: session.user.role,
    },
    accessTokenPresent: false,
    sessionKeys: Object.keys(session),
  });
}
