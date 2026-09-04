import { Navigate, Outlet } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";

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

  return <Outlet />;
};

export default UserRoute;