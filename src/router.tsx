import { createRouter } from "@tanstack/react-router";
import { emptyAuthContext } from "@/lib/auth/types";
import { createAppQueryClient } from "@/lib/errors/create-query-client";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = createAppQueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient, auth: emptyAuthContext },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    defaultPendingMinMs: 200,
    defaultPendingMs: 400,
  });

  return router;
};
