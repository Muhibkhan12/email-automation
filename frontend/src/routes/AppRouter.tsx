import { Routes, Route } from "react-router-dom";
import Dashboard from "../pages/Dashboard";
import EmailLogs from "../pages/EmailLogs";

const AppRouter = () => {
  return (

    <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/emaillogs" element={<EmailLogs />} />
    </Routes>
  )
}

export default AppRouter