import { Navigate, Outlet } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";

const AdminRoute = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("AdminRoute must be used inside AuthProvider");
  }

  const { user, loading } = context;

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Don't reveal that the route exists
  if (user.role !== "ADMIN") {
    return <Navigate to="/404" replace />;
  }

  return <Outlet />;
};

export default AdminRoute;