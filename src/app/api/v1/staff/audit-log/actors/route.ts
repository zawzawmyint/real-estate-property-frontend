import { getActors } from "@/features/activity-log/server";

export async function GET(request: Request) {
  const result = await getActors(new URL(request.url).searchParams.toString());
  return Response.json(result.data ?? { error: "Actor choices unavailable." }, {
    status: result.status,
    headers: { "Cache-Control": "no-store" },
  });
}
