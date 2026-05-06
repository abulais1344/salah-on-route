import { createSupabaseServiceClient, hasSupabaseWriteConfig } from "@/lib/supabase";
import { safeTokenEqual } from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(
  request: Request,
  context: RouteContext<"/api/admin/mosques/[mosqueId]">,
) {
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

  if (!hasSupabaseWriteConfig()) {
    return Response.json(
      {
        error:
          "Supabase write configuration is required to delete masjid records.",
      },
      { status: 400 },
    );
  }

  const { mosqueId } = await context.params;
  if (!mosqueId) {
    return Response.json({ error: "mosqueId is required." }, { status: 400 });
  }

  const supabase = createSupabaseServiceClient();
  if (!supabase) {
    return Response.json(
      { error: "Unable to initialize Supabase service client." },
      { status: 500 },
    );
  }

  const deleteResult = await supabase.from("mosques").delete().eq("id", mosqueId);
  if (deleteResult.error) {
    return Response.json({ error: deleteResult.error.message }, { status: 500 });
  }

  return Response.json({ success: true });
}
