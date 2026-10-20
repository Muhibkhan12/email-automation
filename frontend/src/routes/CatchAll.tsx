import { Navigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";

const CatchAll = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) return null;
  const { user, loading } = ctx;

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/" replace />;

  return (
    <Navigate
      to={user.role === "ADMIN" ? "/admin/dashboard" : "/user/dashboard"}
      replace
    />
  );
};
export default CatchAll;