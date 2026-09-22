import { useEffect, useState } from "react";

const DASHBOARD_API = `${import.meta.env.VITE_API_URL}/api/dashboard`;

function Dashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(DASHBOARD_API);
      const result = await response.json();

      if (!result.success) {
        throw new Error(
          result.message || "Failed to load dashboard"
        );
      }

      setDashboard(result.dashboard);
    } catch (err) {
      console.error("Dashboard error:", err);
      setError(
        "Unable to load dashboard data. Make sure the backend server is running."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const formatCurrency = (value) => {
    return `₹${Number(value || 0).toLocaleString(
      "en-IN"
    )}`;
  };

  const formatGrowth = (value) => {
    if (value === null || value === undefined) {
      return "Not comparable";
    }

    return `${value > 0 ? "+" : ""}${value}%`;
  };

  if (loading) {
    return (
      <div className="page">
        <div className="page-header">
          <div>
            <h1>Dashboard</h1>
            <p>
              Welcome to KOSAR COLLECTION
            </p>
          </div>
        </div>

        <div className="empty-state">
          Loading dashboard...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <div className="page-header">
          <div>
            <h1>Dashboard</h1>
            <p>
              Welcome to KOSAR COLLECTION Smart Shop Manager
            </p>
          </div>
        </div>

        <div className="empty-state">
          <p>{error}</p>

          <button
            className="primary-btn"
            onClick={loadDashboard}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      {/* =========================
          PAGE HEADER
      ========================= */}

      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>
            Welcome to KOSAR COLLECTION Smart Shop Manager
          </p>
        </div>

        <button
          className="primary-btn"
          onClick={loadDashboard}
        >
          Refresh Dashboard
        </button>
      </div>

      {/* =========================
          MAIN BUSINESS STATS
      ========================= */}

      <div className="stats-grid">

        <div className="stat-card">
          <div className="stat-card-content">
            <p>Today's Sales</p>
            <h2>
              {formatCurrency(
                dashboard.todaySales
              )}
            </h2>
            <span>
              Today's revenue
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-content">
            <p>This Month's Sales</p>
            <h2>
              {formatCurrency(
                dashboard.monthSales
              )}
            </h2>
            <span>
              Monthly revenue
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-content">
            <p>This Month's Net Profit</p>
            <h2
              className={
                Number(
                  dashboard.monthNetProfit
                ) < 0
                  ? "negative-value"
                  : "positive-value"
              }
            >
              {formatCurrency(
                dashboard.monthNetProfit
              )}
            </h2>
            <span>
              After expenses
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-content">
            <p>Available Stock</p>
            <h2>
              {dashboard.availableStock}
            </h2>
            <span>
              Total units in inventory
            </span>
          </div>
        </div>

      </div>

      {/* =========================
          MONTHLY FINANCIAL SUMMARY
      ========================= */}

      <section className="section-card">

        <div className="section-header">
          <div>
            <h2>
              This Month's Financial Summary
            </h2>

            <p>
              Understand your current business
              financial position
            </p>
          </div>
        </div>

        <div className="comparison-grid">

          <div className="comparison-card">
            <p>Sales</p>

            <h3>
              {formatCurrency(
                dashboard.monthSales
              )}
            </h3>

            <span>
              Total sales revenue
            </span>
          </div>

          <div className="comparison-card">
            <p>Gross Profit</p>

            <h3>
              {formatCurrency(
                dashboard.monthGrossProfit
              )}
            </h3>

            <span>
              Before shop expenses
            </span>
          </div>

          <div className="comparison-card">
            <p>Shop Expenses</p>

            <h3>
              {formatCurrency(
                dashboard.monthExpenses
              )}
            </h3>

            <span>
              Operating expenses
            </span>
          </div>

          <div className="comparison-card">
            <p>Net Profit</p>

            <h3
              className={
                Number(
                  dashboard.monthNetProfit
                ) < 0
                  ? "negative-value"
                  : "positive-value"
              }
            >
              {formatCurrency(
                dashboard.monthNetProfit
              )}
            </h3>

            <span>
              Final business result
            </span>
          </div>

        </div>
      </section>

      {/* =========================
          MONTHLY COMPARISON
      ========================= */}

      <section className="section-card">

        <div className="section-header">
          <div>
            <h2>
              Monthly Comparison
            </h2>

            <p>
              Compare this month with the
              previous month
            </p>
          </div>
        </div>

        <div className="comparison-grid">

          <div className="comparison-card">
            <p>Current Month Sales</p>

            <h3>
              {formatCurrency(
                dashboard.monthSales
              )}
            </h3>
          </div>

          <div className="comparison-card">
            <p>Previous Month Sales</p>

            <h3>
              {formatCurrency(
                dashboard.previousMonthSales
              )}
            </h3>
          </div>

          <div className="comparison-card">
            <p>Sales Growth</p>

            <h3>
              {formatGrowth(
                dashboard.salesGrowth
              )}
            </h3>
          </div>

          <div className="comparison-card">
            <p>Profit Growth</p>

            <h3>
              {formatGrowth(
                dashboard.profitGrowth
              )}
            </h3>
          </div>

        </div>
      </section>

      {/* =========================
          TODAY'S PERFORMANCE
      ========================= */}

      <section className="section-card">

        <div className="section-header">
          <div>
            <h2>
              Today's Performance
            </h2>

            <p>
              Today's sales and expense position
            </p>
          </div>
        </div>

        <div className="comparison-grid">

          <div className="comparison-card">
            <p>Today's Sales</p>

            <h3>
              {formatCurrency(
                dashboard.todaySales
              )}
            </h3>
          </div>

          <div className="comparison-card">
            <p>Today's Gross Profit</p>

            <h3>
              {formatCurrency(
                dashboard.todayGrossProfit
              )}
            </h3>
          </div>

          <div className="comparison-card">
            <p>Today's Expenses</p>

            <h3>
              {formatCurrency(
                dashboard.todayExpenses
              )}
            </h3>
          </div>

          <div className="comparison-card">
            <p>Today's Net Profit</p>

            <h3
              className={
                Number(
                  dashboard.todayNetProfit
                ) < 0
                  ? "negative-value"
                  : "positive-value"
              }
            >
              {formatCurrency(
                dashboard.todayNetProfit
              )}
            </h3>
          </div>

        </div>
      </section>

      {/* =========================
          PRODUCT & STOCK OVERVIEW
      ========================= */}

      <section className="section-card">

        <div className="section-header">
          <div>
            <h2>
              Product & Stock Overview
            </h2>

            <p>
              Current inventory performance
            </p>
          </div>
        </div>

        <div className="comparison-grid">

          <div className="comparison-card">
            <p>Best Selling Category</p>

            <h3>
              {dashboard.bestSellingCategory}
            </h3>

            <span>
              Based on items sold
            </span>
          </div>

          <div className="comparison-card">
            <p>Best Selling Product</p>

            <h3>
              {dashboard.bestSellingProduct
                ? dashboard.bestSellingProduct
                    .productName
                : "No sales yet"}
            </h3>

            {dashboard.bestSellingProduct && (
              <span>
                {
                  dashboard.bestSellingProduct
                    .itemsSold
                }{" "}
                items sold
              </span>
            )}
          </div>

          <div className="comparison-card">
            <p>Low Stock Items</p>

            <h3
              className={
                dashboard.lowStockItems > 0
                  ? "negative-value"
                  : "positive-value"
              }
            >
              {dashboard.lowStockItems}
            </h3>

            <span>
              Products needing attention
            </span>
          </div>

          <div className="comparison-card">
            <p>Total Available Stock</p>

            <h3>
              {dashboard.availableStock}
            </h3>

            <span>
              Units currently available
            </span>
          </div>

        </div>
      </section>

      {/* =========================
          LOW STOCK ALERT
      ========================= */}

      {dashboard.lowStockProducts &&
        dashboard.lowStockProducts.length > 0 && (
          <section className="section-card">

            <div className="section-header">
              <div>
                <h2>
                  Low Stock Alert
                </h2>

                <p>
                  These products may need
                  replenishment
                </p>
              </div>
            </div>

            <div className="table-wrapper">

              <table className="data-table">

                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Current Stock</th>
                    <th>Minimum Stock</th>
                  </tr>
                </thead>

                <tbody>
                  {dashboard.lowStockProducts.map(
                    (item) => (
                      <tr key={item.id}>
                        <td>
                          <strong>
                            {item.product_name}
                          </strong>
                        </td>

                        <td>
                          {item.category}
                        </td>

                        <td>
                          {item.current_stock}
                        </td>

                        <td>
                          {item.minimum_stock}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>

              </table>
            </div>
          </section>
        )}

      {/* =========================
          SMART BUSINESS INSIGHT
      ========================= */}

      <section className="section-card">

        <div className="section-header">
          <div>
            <h2>
              Smart Business Insight
            </h2>

            <p>
              Automatic analysis based on
              your shop data
            </p>
          </div>
        </div>

        <div className="insight-card">
          <p>
            {dashboard.insight}
          </p>
        </div>

      </section>

    </div>
  );
}

export default Dashboard;
