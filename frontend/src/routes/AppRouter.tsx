import { Routes, Route } from "react-router-dom";
import Dashboard from "../pages/Dashboard";
import Notifications from "../pages/Notifications";
import EmailLogs from "../pages/EmailLogs";
import Templates from "../pages/Templates";
import Settings from "../pages/Settings";
import Profile from "../pages/Profile";
import SenderAccount from "../pages/SenderAccount";
import QueueMonitor from "../pages/QueueMonitor";
import Campaign from "../pages/Campaign";
import Upload from "../pages/Upload";
import Recipients from "../pages/Recipients";
import Analytics from "../pages/Analytics";

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
    </Routes>
  )
}

export default AppRouter