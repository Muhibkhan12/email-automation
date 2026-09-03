import { Routes, Route } from "react-router-dom";
import Dashboard from "../pages/User/UserDashboard";
import Notifications from "../pages/User/Notifications";
import EmailLogs from "../pages/User/EmailLogs";
import Templates from "../pages/User/Templates";
import Settings from "../pages/User/Settings";
import Profile from "../pages/User/Profile";
import SenderAccount from "../pages/User/SenderAccount";
import QueueMonitor from "../pages/User/QueueMonitor";
import Campaign from "../pages/User/Campaign";
import Upload from "../pages/User/Upload";
import Recipients from "../pages/User/Recipients";
import Analytics from "../pages/User/Analytics";
import Login from "../pages/Login";
import Register from "../pages/Register";
import AdminDashboard from "../pages/Admin/AdminDashboard";
import EmailTemplatesAdmin from "../pages/Admin/AdminTemplates";
import AdminCampaigns from "../pages/Admin/AdminCampaigns";
import AdminAnalytics from "../pages/Admin/AdminAnalytics";
import AdminUsers from "../pages/Admin/AdminUsersPage";
import AdminNotifications from "../pages/Admin/AdminNotification";
import AdminEmailLogs from "../pages/Admin/AdminEmaillogs";
import AdminQueueMonitor from "../pages/Admin/AdminQueuemonitor";
import AdminSettings from "../pages/Admin/AdminSettings";
import AdminSenderAccounts from "../pages/Admin/AdminSenderAccount";

const AppRouter = () => {
  return (
    <Routes>
          <Route path="/"  element={<Login/>}/>
          <Route path="/register"  element={<Register/>}/>
        <Route path="/user">
          <Route path="dashboard" element={<Dashboard/>} />
          <Route path="notifications" element={<Notifications/>} />
          <Route path="emaillogs" element={< EmailLogs/>}/>
          <Route path="templates" element={<Templates/> }/>
          <Route path="settings" element={<Settings/>}/>
          <Route path="profile" element={<Profile/>}/>
          <Route path="sender-account" element={<SenderAccount/>} />
          <Route path="queuemonitor" element={<QueueMonitor/>}/>
          <Route path="campaign" element={<Campaign/>}/>
          <Route path="upload" element={<Upload/>} />
          <Route path="analytics" element={<Analytics/>}/>
          <Route path="recipients" element={<Recipients/>}/>

        </Route>
        {/* admin routes */}
        <Route path="/admin">
          <Route path="dashboard"  element={<AdminDashboard/>} />
          <Route path="analytics"  element={<AdminAnalytics/>} />
          <Route path="templates" element={<EmailTemplatesAdmin/>}/>
          <Route path="campaigns" element={<AdminCampaigns/>}/>
          <Route path="users" element={<AdminUsers/>}/>
          <Route path="notifications" element={<AdminNotifications/>}/>
          <Route path="emaillogs" element={<AdminEmailLogs/>}/>
          <Route path="queuemonitor" element={<AdminQueueMonitor/>}/>
          <Route path="settings" element={<AdminSettings/>} />
          <Route path="senders-account" element={<AdminSenderAccounts/>} />
        </Route>
    </Routes>
  )
}

export default AppRouter