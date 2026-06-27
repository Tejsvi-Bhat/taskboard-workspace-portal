import { isSimulationEnabled, setSimulationEnabled } from "@/lib/mock/db";
import { ensureSimulator } from "@/lib/mock/simulator";
import { simulationSchema } from "@/lib/api/schemas";
import { ok, fail, requireSession } from "@/lib/api/http";

/**
 * GET/PATCH /api/simulation — read or toggle the "other users" simulator.
 * State is global (mock backend) so the toggle reflects for everyone, the way a
 * real feature flag would. The simulator self-gates on this flag.
 */
export async function GET() {
  const guard = await requireSession();
  if (guard.response) return guard.response;
  return ok({ enabled: isSimulationEnabled() });
}

export async function PATCH(req: Request) {
  const guard = await requireSession();
  if (guard.response) return guard.response;

  const parsed = simulationSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail(400, "Invalid request.", "INVALID_INPUT");

  const enabled = setSimulationEnabled(parsed.data.enabled);
  if (enabled) ensureSimulator(); // make sure the ticker is running
  return ok({ enabled });
}
