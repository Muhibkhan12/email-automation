import { Routes, Route } from "react-router-dom";

// ================= USER PAGES =================
import Dashboard from "../pages/User/UserDashboard";
import EmailLogs from "../pages/User/EmailLogs";
import Templates from "../pages/User/Templates";
import Settings from "../pages/User/Settings";
import Profile from "../pages/User/Profile";
import SenderAccount from "../pages/User/SenderAccount";
import QueueMonitor from "../pages/User/QueueMonitor";
import Campaign from "../pages/User/Campaign/Campaign";
import Upload from "../pages/User/Upload";
import Recipients from "../pages/User/Recipients";
import Analytics from "../pages/User/Analytics";
import CampaignRecipients from "../pages/User/Campaign/CampaignRecipients";

// ================= PUBLIC PAGES =================
import Login from "../pages/Login";
import Register from "../pages/Register";

// ================= ADMIN PAGES =================
import AdminDashboard from "../pages/Admin/AdminDashboard";
import EmailTemplatesAdmin from "../pages/Admin/AdminTemplates";
import AdminCampaigns from "../pages/Admin/AdminCampaigns";
import AdminAnalytics from "../pages/Admin/AdminAnalytics";
import AdminUsers from "../pages/Admin/AdminUsersPage";
import AdminEmailLogs from "../pages/Admin/AdminEmaillogs";
import AdminQueueMonitor from "../pages/Admin/AdminQueuemonitor";
import AdminSettings from "../pages/Admin/AdminSettings";
import AdminSenderAccounts from "../pages/Admin/AdminSenderAccount";
import { UserProvider } from "../contexts/UsersContext";

// ================= ROUTE GUARDS =================
import UserRoute from "./UserRoutes";
import AdminRoute from "./AdminRoutes";

// ================= 404 PAGE =================
import NotFound from "../pages/NotFound";


const AppRouter = () => {
  return (
    <Routes>

      {/* =================================================
          PUBLIC ROUTES
          Full path: /
      ================================================= */}

      <Route path="/" element={<Login />} />

      {/* Full path: /register */}
      <Route path="/register" element={<Register />} />

      {/* Full path: /404 */}
      <Route path="/404" element={<NotFound />} />


      {/* =================================================
          EMPLOYEE / USER ROUTES

          Only EMPLOYEE can access these routes.
          ADMIN → /404
          Not logged in → /

          NOTE: All routes below are nested under "user",
          so their real browser URL is /user/<path>, NOT
          just /<path>. e.g. Recipients page lives at:
          /user/recipients  (NOT /recipients)
      ================================================= */}

      <Route element={<UserRoute />}>

        <Route path="user">

          {/* Full path: /user/dashboard */}
          <Route path="dashboard" element={<Dashboard />} />

          {/* Full path: /user/emaillogs */}
          <Route path="emaillogs" element={<EmailLogs />} />

          {/* Full path: /user/templates */}
          <Route path="templates" element={<Templates />} />

          {/* Full path: /user/settings */}
          <Route path="settings" element={<Settings />} />

          {/* Full path: /user/profile */}
          <Route path="profile" element={<Profile />} />

          {/* Full path: /user/sender-account */}
          <Route path="sender-account" element={<SenderAccount />} />

          {/* Full path: /user/queuemonitor */}
          <Route path="queuemonitor" element={<QueueMonitor />} />

          {/* Full path: /user/campaign */}
          <Route path="campaign" element={<Campaign />} />
          <Route path="campaigns/:id/recipients" element={<CampaignRecipients />} />

          {/* Full path: /user/upload */}
          <Route path="upload" element={<Upload />} />

          {/* Full path: /user/analytics */}
          <Route path="analytics" element={<Analytics />} />

          {/* Full path: /user/recipients
              Usage example: /user/recipients?campaignId=2 */}
          <Route path="recipients" element={<Recipients />} />

        </Route>

      </Route>


      {/* =================================================
          ADMIN ROUTES

          Only ADMIN can access these routes.
          EMPLOYEE → /404
          Not logged in → /

          NOTE: All routes below are nested under "admin",
          so real browser URL is /admin/<path>.
      ================================================= */}

      <Route element={<AdminRoute />}>

        <Route path="admin">

          {/* Full path: /admin/dashboard */}
          <Route path="dashboard" element={<AdminDashboard />} />

          {/* Full path: /admin/analytics */}
          <Route path="analytics" element={<AdminAnalytics />} />

          {/* Full path: /admin/templates */}
          <Route path="templates" element={<EmailTemplatesAdmin />} />

          {/* Full path: /admin/campaigns */}
          <Route path="campaigns" element={<AdminCampaigns />} />
          <Route path="system" element={<AdminCampaigns />} />

          {/* Full path: /admin/users */}
          <Route
            path="users"
            element={
              <UserProvider>
                <AdminUsers />
              </UserProvider>
            }
          />

          {/* Full path: /admin/emaillogs */}
          <Route path="emaillogs" element={<AdminEmailLogs />} />

          {/* Full path: /admin/queuemonitor */}
          <Route path="queuemonitor" element={<AdminQueueMonitor />} />

          {/* Full path: /admin/settings */}
          <Route path="settings" element={<AdminSettings />} />

          {/* Full path: /admin/senders-account */}
          <Route path="senders-account" element={<AdminSenderAccounts />} />

        </Route>

      </Route>


      {/* =================================================
          CATCH-ALL 404
          Any route that doesn't exist → 404
      ================================================= */}

      <Route path="*" element={<NotFound />} />

    </Routes>
  );
};

export default AppRouter;