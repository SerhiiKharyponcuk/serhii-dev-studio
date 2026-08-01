import { useQuery } from "@tanstack/react-query";
import { Navigate, Outlet } from "react-router";
import { api } from "../../lib/api";
import { LoadingState } from "../../components/AsyncState";

type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: "CLIENT" | "ADMIN" | "SUPPORT";
};
export function ProtectedRoute({ admin = false }: { admin?: boolean }) {
  const query = useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      const response = await api.get<{ data: CurrentUser }>("/auth/me");
      return response.data.data;
    },
    retry: false
  });
  if (query.isPending)
    return (
      <div className="shell section">
        <LoadingState title="Checking your session" />
      </div>
    );
  if (query.isError) return <Navigate to="/login" replace />;
  if (admin && query.data.role !== "ADMIN") return <Navigate to="/dashboard" replace />;
  return <Outlet context={{ user: query.data }} />;
}
