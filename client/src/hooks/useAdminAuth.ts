import { adminTrpc } from "@/lib/adminTrpc";

export function useAdminAuth() {
  const { data: admin, isLoading, error } = adminTrpc.auth.me.useQuery();

  return {
    admin: admin ?? null,
    isAuthenticated: !!admin,
    loading: isLoading,
    error,
  };
}
