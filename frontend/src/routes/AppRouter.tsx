import { Routes, Route } from "react-router-dom";
import Dashboard from "../pages/Dashboard";
import Notifications from "../pages/Notifications";
import EmailLogs from "../pages/EmailLogs";
import Templates from "../pages/Templates";

const AppRouter = () => {
  return (
    <Routes>
        <Route path="/" element={<Dashboard/>} />
        <Route path="/notifications" element={<Notifications/>} />
        <Route path="/emaillogs" element={< EmailLogs/>}/>
        <Route path="/templates" element={<Templates/> }/>
    </Routes>
  )
}

export default AppRouter