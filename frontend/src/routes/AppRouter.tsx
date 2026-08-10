import { Routes, Route } from "react-router-dom";
import Dashboard from "../pages/Dashboard";
import EmailLogsPage from "../pages/EmailLogs";
import Notifications from "../pages/Notifications";


const AppRouter = () => {
  return (
    <Routes>
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/emaillogs" element={<EmailLogsPage />} />
      <Route path="/notifications" element={<Notifications/>} />
    </Routes>
  );
};

export default AppRouter;