import { Navigate, Outlet } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";

const UserRoute = () => {

  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("UserRoute must be used inside AuthProvider");
  }

  const { user, loading } = context;

  console.log("========== USER ROUTE ==========");
  console.log("loading:", loading);
  console.log("user:", user);
  console.log("user.role:", user?.role);
  console.log("role === EMPLOYEE:", user?.role === "EMPLOYEE");

  if (loading) {
    console.log("⏳ USER ROUTE: LOADING");
    return <div>Loading...</div>;
  }

  if (!user) {
    console.log("❌ USER ROUTE: NO USER → LOGIN");
    return <Navigate to="/" replace />;
  }

  if (user.role !== "EMPLOYEE") {
    console.log("❌ USER ROUTE: WRONG ROLE → 404");
    console.log("Actual role:", user.role);
    return <Navigate to="/404" replace />;
  }

  console.log("✅ USER ROUTE: ALLOWED");

  return <Outlet />;
};

export default UserRoute;