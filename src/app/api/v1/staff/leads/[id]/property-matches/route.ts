import { LeadApiError } from "@/features/leads/data/request";
import { getStaffLeadPropertyMatches } from "@/features/leads/data/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const headers = { "Cache-Control": "no-store" };
  try {
    const page = await getStaffLeadPropertyMatches(
      id,
      new URL(request.url).search,
    );
    return Response.json(page, { headers });
  } catch (error) {
    if (error instanceof LeadApiError && error.status >= 400) {
      const { status, code, message, requestId } = error;
      return Response.json(
        { error: { code, message, requestId } },
        { status, headers },
      );
    }
    return Response.json(
      {
        error: {
          code: "SERVICE_UNAVAILABLE",
          message: "Matching properties could not be loaded.",
        },
      },
      { status: 503, headers },
    );
  }
}
