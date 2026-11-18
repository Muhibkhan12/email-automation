// AdminRoutes.tsx
import { Navigate, Outlet } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";

import { EmailLogsProvider } from "../contexts/EmailLogsContext";         // ← lowercase l
import { SenderAccountsProvider } from "../contexts/SenderAccountsContext";
import HtmlTemplatesProvider from "../contexts/HtmlTemplatesContext";
import { CampaignProvider } from "../contexts/CampaignContext";
import RecipientsContextProvider from "../contexts/RecipientsContext";   // ← ADD THIS
import { UserProvider } from "../contexts/UsersContext";

const AdminRoute = () => {
  const context = useContext(AuthContext);

  if (!context) throw new Error("AdminRoute must be used inside AuthProvider");

  const { user, loading } = context;

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/" replace />;
  if (user.role !== "ADMIN") return <Navigate to="/404" replace />;

  return (
    <EmailLogsProvider>
      <SenderAccountsProvider>
        <CampaignProvider>
          <RecipientsContextProvider>          {/* ← NEW */}
            <HtmlTemplatesProvider>
              <UserProvider>
                <Outlet />
              </UserProvider>
            </HtmlTemplatesProvider>
          </RecipientsContextProvider>
        </CampaignProvider>
      </SenderAccountsProvider>
    </EmailLogsProvider>
  );
};

export default AdminRoute;