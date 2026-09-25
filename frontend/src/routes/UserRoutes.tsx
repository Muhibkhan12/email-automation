// UserRoutes.tsx
import { Navigate, Outlet } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";

import { EmailLogsProvider } from "../contexts/EmaillogsContext";
import { SenderAccountsProvider } from "../contexts/SenderAccountsContext";
import HtmlTemplatesProvider from "../contexts/HtmlTemplatesContext";
import RecipientsContextProvider from "../contexts/RecipientsContext";
import { CampaignProvider } from "../contexts/CampaignContext";
import { UploadProvider } from "../contexts/UploadContext";

const UserRoute = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("UserRoute must be used inside AuthProvider");
  }

  const { user, loading } = context;

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (user.role !== "EMPLOYEE") {
    return <Navigate to="/404" replace />;
  }

  // Providers only mount when the user is confirmed to be an EMPLOYEE.
  return (
    <EmailLogsProvider>
      <SenderAccountsProvider>
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
  );
};

export default UserRoute;