import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav>
      <div>
        <h1>Outwerk</h1>

        <Link to="/dashboard">Dashboard</Link>
        <Link to="/emaillogs">Email Logs</Link>
        <Link to={"/notifications"}>Notifications</Link>
      </div>
    </nav>
  );
};

export default Navbar;