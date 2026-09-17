import { NavLink } from "react-router-dom";

function Sidebar() {
  const menuItems = [
    {
      name: "Dashboard",
      path: "/",
    },
    {
      name: "Sales",
      path: "/sales",
    },
    {
      name: "Purchases",
      path: "/purchases",
    },
    {
      name: "Inventory",
      path: "/inventory",
    },
    {
      name: "Expenses",
      path: "/expenses",
    },
    {
      name: "Reports",
      path: "/reports",
    },
  ];

  return (
    <aside className="sidebar">
      {/* LOGO */}
      <div className="sidebar-logo">
        <div>
          <h2>KOSAR</h2>
          <span>COLLECTION</span>
        </div>
      </div>

      {/* NAVIGATION */}
      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              isActive ? "nav-item active" : "nav-item"
            }
          >
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* FOOTER */}
      <div className="sidebar-footer">
        <p>© 2026 WaseemCodes</p>
        <span></span>
      </div>
    </aside>
  );
}

export default Sidebar;
