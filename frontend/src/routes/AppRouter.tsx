import { Routes, Route } from "react-router-dom";
import Dashboard from "../pages/Dashboard";
import EmailLogsPage from "../pages/EmailLogs";


const AppRouter = () => {
  return (
    <Routes>
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/emaillogs" element={<EmailLogsPage />} />
    </Routes>
  );
};

export default AppRouter;