import { listMosques } from "@/lib/mosques";
import { safeTokenEqual } from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const expectedToken = process.env.ADMIN_DASHBOARD_TOKEN;
  if (!expectedToken) {
    return Response.json(
      { error: "ADMIN_DASHBOARD_TOKEN is not configured." },
      { status: 500 },
    );
  }

  const providedToken = request.headers.get("x-admin-token");
  if (!safeTokenEqual(expectedToken, providedToken)) {
    return Response.json({ error: "Unauthorized admin request." }, { status: 401 });
  }

  const mosques = await listMosques();
  const sorted = [...mosques].sort(
    (first, second) =>
      new Date(second.lastUpdated).getTime() - new Date(first.lastUpdated).getTime(),
  );

  return Response.json({ mosques: sorted });
}
