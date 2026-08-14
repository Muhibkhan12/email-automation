import { Routes, Route } from "react-router-dom";
import Dashboard from "../pages/User/Dashboard";
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

const AppRouter = () => {
  return (
    <Routes>
        <Route path="/" element={<Dashboard/>} />
        <Route path="/notifications" element={<Notifications/>} />
        <Route path="/emaillogs" element={< EmailLogs/>}/>
        <Route path="/templates" element={<Templates/> }/>
        <Route path="/settings" element={<Settings/>}/>
        <Route path="/profile" element={<Profile/>}/>
        <Route path="/sender-account" element={<SenderAccount/>} />
        <Route path="/queuemonitor" element={<QueueMonitor/>}/>
        <Route path="/campaign" element={<Campaign/>}/>
        <Route path="/upload" element={<Upload/>} />
        <Route path="/analytics" element={<Analytics/>}/>
        <Route path="/recipients" element={<Recipients/>}/>
        <Route path="/login"  element={<Login/>}/>
        <Route path="/register"  element={<Register/>}/>
    </Routes>
  )
}

export default AppRouter