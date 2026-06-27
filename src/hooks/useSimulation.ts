"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/endpoints";
import { queryKeys } from "@/lib/query/keys";
import { toast } from "@/store/toast";

/**
 * Read + toggle the "simulated live activity" feature flag. Server-owned state,
 * so it's modeled as a query + mutation (optimistic) rather than client state.
 */
export function useSimulation() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.simulation,
    queryFn: async () => (await api.getSimulation()).enabled,
  });

  const toggle = useMutation({
    mutationFn: (enabled: boolean) => api.setSimulation(enabled),
    onMutate: async (enabled) => {
      await qc.cancelQueries({ queryKey: queryKeys.simulation });
      const previous = qc.getQueryData<boolean>(queryKeys.simulation);
      qc.setQueryData<boolean>(queryKeys.simulation, enabled);
      return { previous };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.previous !== undefined) qc.setQueryData(queryKeys.simulation, ctx.previous);
      toast.error("Couldn't update live activity setting.");
    },
    onSuccess: (data) => {
      toast.info(data.enabled ? "Live activity simulation on" : "Live activity simulation paused");
    },
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.simulation }),
  });

  return { enabled: query.data ?? true, isLoading: query.isLoading, toggle };
}
