import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Layout({ children }) {
  const { user, logout } = useAuth();

  return (
    <div className="layout">
      <aside className="sidebar">
        <h2>KristalBall</h2>
        <p className="muted">Military Asset Management</p>
        <nav>
          <NavLink to="/dashboard">Dashboard</NavLink>
          <NavLink to="/purchases">Purchases</NavLink>
          <NavLink to="/transfers">Transfers</NavLink>
          <NavLink to="/assignments">Assignments</NavLink>
        </nav>
        <div className="user-card">
          <strong>{user?.name}</strong>
          <span>{user?.role}</span>
          <span>{user?.base}</span>
          <button onClick={logout}>Logout</button>
        </div>
        <Link className="cred-link" to="/login">Switch User</Link>
      </aside>
      <main className="content">{children}</main>
    </div>
  );
}
