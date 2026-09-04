import { Navigate, Outlet } from "react-router-dom";
import { useContext } from "react";
import UsersContext from "../contexts/UsersContext";

const AdminRoute = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("AdminRoute must be used inside AuthProvider");
  }

  const { user, loading } = context;

  // Wait for authentication to initialize
  if (loading) {
    return <div>Loading...</div>;
  }

  // Not logged in
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Logged in but not an admin
  if (user.role !== "ADMIN") {
    return <Navigate to="/user/dashboard" replace />;
  }

  // User is logged in AND is ADMIN
  return <Outlet />;
};

export default AdminRoute;