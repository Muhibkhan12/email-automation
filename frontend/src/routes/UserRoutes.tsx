import { Navigate, Outlet } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";

const UserRoute = () => {

  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("UserRoute must be used inside AuthProvider");
  }

  const { user, loading } = context;

  console.log("[UserRoute] loading:", loading);
  console.log("[UserRoute] user object:", user);
  console.log("[UserRoute] user.role:", user?.role);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    console.log("[UserRoute] No user found, redirecting to /");
    return <Navigate to="/" replace />;
  }

  if (user.role !== "EMPLOYEE") {
    console.log(
      `[UserRoute] Role mismatch. Expected "EMPLOYEE", got "${user.role}". Redirecting to /404`
    );
    return <Navigate to="/404" replace />;
  }

  return <Outlet />;
};

export default UserRoute;