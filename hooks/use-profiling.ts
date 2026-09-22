"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { axiomApi } from "../lib/api";
import type { ProfileRequest } from "../lib/types";

const PROFILES_POLL_MS = 10000;

export function useProfiles(limit = 20) {
  return useQuery({
    queryKey: ["profiles", limit],
    queryFn: () => axiomApi.getProfiles(limit),
    refetchInterval: PROFILES_POLL_MS,
  });
}

export function useProfile(reportId: string | null) {
  return useQuery({
    queryKey: ["profiles", reportId],
    queryFn: () => (reportId ? axiomApi.getProfile(reportId) : Promise.reject("No ID")),
    enabled: !!reportId,
  });
}

export function useRunProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: ProfileRequest) => axiomApi.createProfile(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
    },
  });
}
