// AdminRoutes.tsx
import { Navigate, Outlet } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";

import { EmailLogsProvider } from "../contexts/EmaillogsContext";
import { SenderAccountsProvider } from "../contexts/SenderAccountsContext";
import HtmlTemplatesProvider from "../contexts/HtmlTemplatesContext";
import { CampaignProvider } from "../contexts/CampaignContext";
import RecipientsContextProvider from "../contexts/RecipientsContext";
import { UploadProvider } from "../contexts/UploadContext";
import { UserProvider } from "../contexts/UsersContext";

const AdminRoute = () => {
  const context = useContext(AuthContext);

  if (!context) throw new Error("AdminRoute must be used inside AuthProvider");

  const { user, loading } = context;

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/" replace />;
  if (user.role !== "ADMIN") return <Navigate to="/404" replace />;

  return (
    <UserProvider>
      <EmailLogsProvider>
        <SenderAccountsProvider mode="admin">
          <CampaignProvider>
            <HtmlTemplatesProvider>
              <RecipientsContextProvider>
                <UploadProvider>
                  <Outlet />
                </UploadProvider>
              </RecipientsContextProvider>
            </HtmlTemplatesProvider>
          </CampaignProvider>
        </SenderAccountsProvider>
      </EmailLogsProvider>
    </UserProvider>
  );
};

export default AdminRoute;