import { Navigate, Outlet } from "react-router-dom";
import { useContext } from "react";
import UsersContext from "../contexts/UsersContext";

const ProtectedRoute = () => {
  const context = useContext(UsersContext);

  if (!context) {
    throw new Error("ProtectedRoute must be inside UserProvider");
  }

  const { user, loading } = context;

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;