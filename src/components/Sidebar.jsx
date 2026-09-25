import { NavLink } from "react-router-dom";

function Sidebar() {
  const menuItems = [
    { name: "Dashboard", path: "/" },
    { name: "Sales", path: "/sales" },
    { name: "Purchases", path: "/purchases" },
    { name: "Inventory", path: "/inventory" },
    { name: "Expenses", path: "/expenses" },
    { name: "Reports", path: "/reports" },
  ];

  const handleLogout = () => {
    localStorage.removeItem("kosar_token");
    localStorage.removeItem("kosar_user");

    window.location.hash = "#/login";
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div>
          <h2>KOSAR</h2>
          <span>COLLECTION</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              isActive
                ? "nav-item active"
                : "nav-item"
            }
          >
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <p>Mohammad Waseem Shaikh</p>
        <span>Owner & Developer</span>

        <button
          type="button"
          className="logout-button"
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
