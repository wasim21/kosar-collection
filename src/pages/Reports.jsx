import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const API_URL = import.meta.env.VITE_API_URL;


const MONTHLY_API =
  `${API_URL}/api/reports/monthly`;

const CATEGORY_API =
  `${API_URL}/api/reports/category-performance`;

const PRODUCT_API =
  `${API_URL}/api/reports/product-performance`;


function Reports() {
  const [monthlyData, setMonthlyData] = useState([]);
  const [comparison, setComparison] = useState(null);
  const [bestMonth, setBestMonth] = useState(null);

  const [categories, setCategories] = useState([]);
  const [bestSelling, setBestSelling] = useState(null);
  const [slowSelling, setSlowSelling] = useState(null);
  const [mostProfitable, setMostProfitable] =
    useState(null);

  const [products, setProducts] = useState([]);
  const [bestSellingProduct, setBestSellingProduct] =
    useState(null);
  const [slowMovingProduct, setSlowMovingProduct] =
    useState(null);
  const [mostProfitableProduct, setMostProfitableProduct] =
    useState(null);
  const [lowStockProducts, setLowStockProducts] =
    useState([]);
  const [noSalesProducts, setNoSalesProducts] =
    useState([]);

  const [loading, setLoading] = useState(true);

  const loadReports = async () => {
    try {
      setLoading(true);

      const [
        monthlyResponse,
        categoryResponse,
        productResponse,
      ] = await Promise.all([
        fetch(MONTHLY_API),
        fetch(CATEGORY_API),
        fetch(PRODUCT_API),
      ]);

      const monthlyResult =
        await monthlyResponse.json();

      const categoryResult =
        await categoryResponse.json();

      const productResult =
        await productResponse.json();

      /*
      ==============================================
      MONTHLY REPORT
      ==============================================
      */

      if (monthlyResult.success) {
        setMonthlyData(
          monthlyResult.report || []
        );

        setComparison(
          monthlyResult.comparison || null
        );

        setBestMonth(
          monthlyResult.bestMonth || null
        );
      }

      /*
      ==============================================
      CATEGORY PERFORMANCE
      ==============================================
      */

      if (categoryResult.success) {
        setCategories(
          categoryResult.categories || []
        );

        setBestSelling(
          categoryResult.bestSelling || null
        );

        setSlowSelling(
          categoryResult.slowSelling || null
        );

        setMostProfitable(
          categoryResult.mostProfitable || null
        );
      }

      /*
      ==============================================
      PRODUCT PERFORMANCE
      ==============================================
      */

      if (productResult.success) {
        setProducts(
          productResult.products || []
        );

        setBestSellingProduct(
          productResult.bestSelling || null
        );

        setSlowMovingProduct(
          productResult.slowMoving || null
        );

        setMostProfitableProduct(
          productResult.mostProfitable || null
        );

        setLowStockProducts(
          productResult.lowStockProducts || []
        );

        setNoSalesProducts(
          productResult.noSalesProducts || []
        );
      }
    } catch (error) {
      console.error(
        "Reports loading error:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  /*
  ==============================================
  HELPERS
  ==============================================
  */

  const formatCurrency = (value) => {
    return `₹${Number(
      value || 0
    ).toLocaleString("en-IN")}`;
  };

  const getMonthName = (month) => {
    return new Date(
      2000,
      month - 1,
      1
    ).toLocaleString("en-US", {
      month: "long",
    });
  };

  const formatMonthYear = (item) => {
    if (!item) {
      return "-";
    }

    return `${getMonthName(item.month)} ${
      item.year
    }`;
  };

  /*
  ==============================================
  FINANCIAL TOTALS
  ==============================================
  */

  const totalSales = monthlyData.reduce(
    (sum, item) =>
      sum + Number(item.sales || 0),
    0
  );

  const totalGrossProfit =
    monthlyData.reduce(
      (sum, item) =>
        sum + Number(
          item.grossProfit || 0
        ),
      0
    );

  const totalExpenses =
    monthlyData.reduce(
      (sum, item) =>
        sum + Number(
          item.expenses || 0
        ),
      0
    );

  const totalNetProfit =
    totalGrossProfit - totalExpenses;

  const currentMonth =
    comparison?.currentMonth;

  const previousMonth =
    comparison?.previousMonth;

  /*
  ==============================================
  LOADING
  ==============================================
  */

  if (loading) {
    return (
      <div className="page">
        <div className="page-header">
          <div>
            <h1>
              Reports & Analytics
            </h1>

            <p>
              View sales, profit and business
              performance
            </p>
          </div>
        </div>

        <div className="empty-state">
          Loading reports...
        </div>
      </div>
    );
  }

  return (
    <div className="page">

      {/* ==========================================
          PAGE HEADER
      ========================================== */}

      <div className="page-header">
        <div>
          <h1>
            Reports & Analytics
          </h1>

          <p>
            View sales, profit and business
            performance
          </p>
        </div>

        <button
          className="primary-btn"
          onClick={loadReports}
        >
          Refresh
        </button>
      </div>


      {/* ==========================================
          FINANCIAL SUMMARY
      ========================================== */}

      <div className="stats-grid">

        <div className="stat-card">
          <div className="stat-card-content">
            <p>Total Sales</p>

            <h2>
              {formatCurrency(totalSales)}
            </h2>
          </div>
        </div>


        <div className="stat-card">
          <div className="stat-card-content">
            <p>Gross Profit</p>

            <h2>
              {formatCurrency(
                totalGrossProfit
              )}
            </h2>
          </div>
        </div>


        <div className="stat-card">
          <div className="stat-card-content">
            <p>Total Expenses</p>

            <h2>
              {formatCurrency(
                totalExpenses
              )}
            </h2>
          </div>
        </div>


        <div className="stat-card">
          <div className="stat-card-content">
            <p>Net Profit</p>

            <h2>
              {formatCurrency(
                totalNetProfit
              )}
            </h2>
          </div>
        </div>

      </div>


      {/* ==========================================
          MONTHLY COMPARISON
      ========================================== */}

      <section className="section-card">

        <div className="section-header">
          <div>
            <h2>
              Monthly Comparison
            </h2>

            <p>
              Compare the current month with
              the previous month
            </p>
          </div>
        </div>


        <div className="comparison-grid">

          <div className="comparison-card">
            <p>
              Current Month Sales
            </p>

            <h3>
              {formatCurrency(
                currentMonth?.sales || 0
              )}
            </h3>

            <span>
              {formatMonthYear(
                currentMonth
              )}
            </span>
          </div>


          <div className="comparison-card">
            <p>
              Previous Month Sales
            </p>

            <h3>
              {formatCurrency(
                previousMonth?.sales || 0
              )}
            </h3>

            <span>
              {formatMonthYear(
                previousMonth
              )}
            </span>
          </div>


          <div className="comparison-card">
            <p>
              Sales Growth
            </p>

            <h3>
              {comparison?.salesGrowth ===
              null
                ? "Not comparable"
                : `${comparison?.salesGrowth}%`}
            </h3>
          </div>


          <div className="comparison-card">
            <p>
              Profit Growth
            </p>

            <h3>
              {comparison?.profitGrowth ===
              null
                ? "Not comparable"
                : `${comparison?.profitGrowth}%`}
            </h3>
          </div>

        </div>
      </section>


      {/* ==========================================
          MONTHLY PERFORMANCE
      ========================================== */}

      <section className="section-card">

        <div className="section-header">
          <div>
            <h2>
              Monthly Performance
            </h2>

            <p>
              Sales, gross profit and expenses
            </p>
          </div>
        </div>


        {monthlyData.length > 0 ? (
          <>
            <div
              style={{
                width: "100%",
                height: 350,
              }}
            >
              <ResponsiveContainer>
                <BarChart
                  data={monthlyData}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                  />

                  <XAxis
                    dataKey="month"
                    tickFormatter={(month) =>
                      getMonthName(
                        month
                      ).slice(0, 3)
                    }
                  />

                  <YAxis />

                  <Tooltip
                    formatter={(value) =>
                      formatCurrency(
                        value
                      )
                    }
                  />

                  <Bar
                    dataKey="sales"
                    name="Sales"
                  />

                  <Bar
                    dataKey="grossProfit"
                    name="Gross Profit"
                  />

                  <Bar
                    dataKey="expenses"
                    name="Expenses"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>


            <div
              style={{
                display: "flex",
                gap: "20px",
                marginTop: "15px",
                fontSize: "14px",
              }}
            >
              <span>
                Sales
              </span>

              <span>
                Gross Profit
              </span>

              <span>
                Expenses
              </span>
            </div>
          </>
        ) : (
          <div className="empty-state">
            No monthly data available.
          </div>
        )}

      </section>


      {/* ==========================================
          BEST PERFORMING MONTH
      ========================================== */}

      {bestMonth && (
        <section className="section-card">

          <div className="section-header">
            <div>
              <h2>
                Best Performing Month
              </h2>

              <p>
                Month with the highest net
                profit
              </p>
            </div>
          </div>


          <div className="best-month-card">

            <h3>
              {formatMonthYear(
                bestMonth
              )}
            </h3>

            <p>
              Net Profit:{" "}
              <strong>
                {formatCurrency(
                  bestMonth.netProfit
                )}
              </strong>
            </p>

          </div>

        </section>
      )}


      {/* ==========================================
          MONTHLY BUSINESS REPORT
      ========================================== */}

      <section className="section-card">

        <div className="section-header">
          <div>
            <h2>
              Monthly Business Report
            </h2>

            <p>
              Detailed monthly financial
              performance
            </p>
          </div>
        </div>


        <div className="table-wrapper">

          <table className="data-table">

            <thead>
              <tr>
                <th>
                  Month
                </th>

                <th>
                  Sales
                </th>

                <th>
                  Cost
                </th>

                <th>
                  Gross Profit
                </th>

                <th>
                  Expenses
                </th>

                <th>
                  Net Profit
                </th>
              </tr>
            </thead>


            <tbody>

              {monthlyData.length > 0 ? (
                monthlyData.map(
                  (item) => (
                    <tr
                      key={`${item.year}-${item.month}`}
                    >
                      <td>
                        {formatMonthYear(
                          item
                        )}
                      </td>

                      <td>
                        {formatCurrency(
                          item.sales
                        )}
                      </td>

                      <td>
                        {formatCurrency(
                          item.cost
                        )}
                      </td>

                      <td>
                        {formatCurrency(
                          item.grossProfit
                        )}
                      </td>

                      <td>
                        {formatCurrency(
                          item.expenses
                        )}
                      </td>

                      <td>
                        {formatCurrency(
                          item.netProfit
                        )}
                      </td>
                    </tr>
                  )
                )
              ) : (
                <tr>
                  <td
                    colSpan="6"
                    style={{
                      textAlign:
                        "center",
                    }}
                  >
                    No monthly records
                    found.
                  </td>
                </tr>
              )}

            </tbody>

          </table>

        </div>

      </section>


      {/* ==========================================
          CATEGORY PERFORMANCE
      ========================================== */}

      <section className="section-card">

        <div className="section-header">
          <div>
            <h2>
              Category Performance
            </h2>

            <p>
              Understand which clothing
              categories are selling and
              generating profit
            </p>
          </div>
        </div>


        {/* CATEGORY HIGHLIGHTS */}

        <div className="comparison-grid">

          <div className="comparison-card">

            <p>
              Best Selling Category
            </p>

            <h3>
              {bestSelling
                ? bestSelling.category
                : "No sales yet"}
            </h3>

            {bestSelling && (
              <span>
                {bestSelling.itemsSold}{" "}
                items sold
              </span>
            )}

          </div>


          <div className="comparison-card">

            <p>
              Most Profitable Category
            </p>

            <h3>
              {mostProfitable
                ? mostProfitable.category
                : "No sales yet"}
            </h3>

            {mostProfitable && (
              <span>
                {formatCurrency(
                  mostProfitable.grossProfit
                )}{" "}
                gross profit
              </span>
            )}

          </div>


          <div className="comparison-card">

            <p>
              Slowest Selling Category
            </p>

            <h3>
              {slowSelling
                ? slowSelling.category
                : "No sales yet"}
            </h3>

            {slowSelling && (
              <span>
                {slowSelling.itemsSold}{" "}
                items sold
              </span>
            )}

          </div>

        </div>


        {/* CATEGORY CHART */}

        {categories.length > 0 && (
          <div
            style={{
              width: "100%",
              height: 350,
              marginTop: "30px",
            }}
          >
            <ResponsiveContainer>

              <BarChart
                data={categories}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                />

                <XAxis
                  dataKey="category"
                />

                <YAxis />

                <Tooltip
                  formatter={(value) =>
                    formatCurrency(
                      value
                    )
                  }
                />

                <Bar
                  dataKey="sales"
                  name="Sales"
                />

              </BarChart>

            </ResponsiveContainer>
          </div>
        )}


        {/* CATEGORY TABLE */}

        <div
          className="table-wrapper"
          style={{
            marginTop: "30px",
          }}
        >
          <table className="data-table">

            <thead>
              <tr>

                <th>
                  Category
                </th>

                <th>
                  Items Sold
                </th>

                <th>
                  Sales
                </th>

                <th>
                  Cost
                </th>

                <th>
                  Gross Profit
                </th>

                <th>
                  Profit Margin
                </th>

              </tr>
            </thead>


            <tbody>

              {categories.length > 0 ? (
                categories.map(
                  (item) => (
                    <tr
                      key={
                        item.category
                      }
                    >

                      <td>
                        <strong>
                          {item.category}
                        </strong>
                      </td>

                      <td>
                        {item.itemsSold}
                      </td>

                      <td>
                        {formatCurrency(
                          item.sales
                        )}
                      </td>

                      <td>
                        {formatCurrency(
                          item.cost
                        )}
                      </td>

                      <td>
                        {formatCurrency(
                          item.grossProfit
                        )}
                      </td>

                      <td>
                        {item.profitMargin}%
                      </td>

                    </tr>
                  )
                )
              ) : (
                <tr>
                  <td
                    colSpan="6"
                    style={{
                      textAlign:
                        "center",
                    }}
                  >
                    No category sales
                    found.
                  </td>
                </tr>
              )}

            </tbody>

          </table>
        </div>

      </section>


      {/* ==========================================
          PRODUCT PERFORMANCE
      ========================================== */}

      <section className="section-card">

        <div className="section-header">

          <div>
            <h2>
              Product Performance
            </h2>

            <p>
              Understand which individual
              products are selling and
              generating profit
            </p>
          </div>

        </div>


        {/* PRODUCT HIGHLIGHTS */}

        <div className="comparison-grid">

          <div className="comparison-card">

            <p>
              Best Selling Product
            </p>

            <h3>
              {bestSellingProduct
                ? bestSellingProduct.productName
                : "No sales yet"}
            </h3>

            {bestSellingProduct && (
              <span>
                {
                  bestSellingProduct.itemsSold
                }{" "}
                items sold
              </span>
            )}

          </div>


          <div className="comparison-card">

            <p>
              Most Profitable Product
            </p>

            <h3>
              {mostProfitableProduct
                ? mostProfitableProduct.productName
                : "No sales yet"}
            </h3>

            {mostProfitableProduct && (
              <span>
                {formatCurrency(
                  mostProfitableProduct.grossProfit
                )}{" "}
                gross profit
              </span>
            )}

          </div>


          <div className="comparison-card">

            <p>
              Slow-Moving Product
            </p>

            <h3>
              {slowMovingProduct
                ? slowMovingProduct.productName
                : "No sales yet"}
            </h3>

            {slowMovingProduct && (
              <span>
                {
                  slowMovingProduct.itemsSold
                }{" "}
                items sold
              </span>
            )}

          </div>


          <div className="comparison-card">

            <p>
              Low Stock Products
            </p>

            <h3>
              {lowStockProducts.length}
            </h3>

            <span>
              Products requiring attention
            </span>

          </div>

        </div>


        {/* PRODUCT SALES CHART */}

        {products.length > 0 && (
          <div
            style={{
              width: "100%",
              height: 350,
              marginTop: "30px",
            }}
          >
            <ResponsiveContainer>

              <BarChart
                data={products}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                />

                <XAxis
                  dataKey="productName"
                />

                <YAxis />

                <Tooltip
                  formatter={(value) =>
                    formatCurrency(
                      value
                    )
                  }
                />

                <Bar
                  dataKey="sales"
                  name="Sales"
                />

              </BarChart>

            </ResponsiveContainer>
          </div>
        )}


        {/* PRODUCT TABLE */}

        <div
          className="table-wrapper"
          style={{
            marginTop: "30px",
          }}
        >

          <table className="data-table">

            <thead>

              <tr>

                <th>
                  Product
                </th>

                <th>
                  Category
                </th>

                <th>
                  Stock
                </th>

                <th>
                  Sold
                </th>

                <th>
                  Sales
                </th>

                <th>
                  Gross Profit
                </th>

                <th>
                  Margin
                </th>

              </tr>

            </thead>


            <tbody>

              {products.length > 0 ? (
                products.map(
                  (item) => (
                    <tr
                      key={item.id}
                    >

                      <td>
                        <strong>
                          {
                            item.productName
                          }
                        </strong>
                      </td>

                      <td>
                        {item.category}
                      </td>

                      <td>
                        {item.currentStock}
                      </td>

                      <td>
                        {item.itemsSold}
                      </td>

                      <td>
                        {formatCurrency(
                          item.sales
                        )}
                      </td>

                      <td>
                        {formatCurrency(
                          item.grossProfit
                        )}
                      </td>

                      <td>
                        {item.profitMargin}%
                      </td>

                    </tr>
                  )
                )
              ) : (
                <tr>

                  <td
                    colSpan="7"
                    style={{
                      textAlign:
                        "center",
                    }}
                  >
                    No product records
                    found.
                  </td>

                </tr>
              )}

            </tbody>

          </table>

        </div>


        {/* LOW STOCK PRODUCTS */}

        {lowStockProducts.length > 0 && (
          <div
            style={{
              marginTop: "30px",
            }}
          >

            <div className="section-header">
              <div>

                <h2>
                  Low Stock Products
                </h2>

                <p>
                  These products need
                  replenishment.
                </p>

              </div>
            </div>


            <div className="table-wrapper">

              <table className="data-table">

                <thead>

                  <tr>

                    <th>
                      Product
                    </th>

                    <th>
                      Category
                    </th>

                    <th>
                      Current Stock
                    </th>

                    <th>
                      Minimum Stock
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {lowStockProducts.map(
                    (item) => (
                      <tr
                        key={item.id}
                      >

                        <td>
                          <strong>
                            {
                              item.productName
                            }
                          </strong>
                        </td>

                        <td>
                          {item.category}
                        </td>

                        <td>
                          {item.currentStock}
                        </td>

                        <td>
                          {item.minimumStock}
                        </td>

                      </tr>
                    )
                  )}

                </tbody>

              </table>

            </div>

          </div>
        )}


        {/* PRODUCTS WITH NO SALES */}

        {noSalesProducts.length > 0 && (
          <div
            style={{
              marginTop: "30px",
            }}
          >

            <div className="section-header">
              <div>

                <h2>
                  Products With No Sales
                </h2>

                <p>
                  These products have
                  inventory but have not
                  recorded any sales yet.
                </p>

              </div>
            </div>


            <div className="table-wrapper">

              <table className="data-table">

                <thead>

                  <tr>

                    <th>
                      Product
                    </th>

                    <th>
                      Category
                    </th>

                    <th>
                      Current Stock
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {noSalesProducts.map(
                    (item) => (
                      <tr
                        key={item.id}
                      >

                        <td>
                          <strong>
                            {
                              item.productName
                            }
                          </strong>
                        </td>

                        <td>
                          {item.category}
                        </td>

                        <td>
                          {item.currentStock}
                        </td>

                      </tr>
                    )
                  )}

                </tbody>

              </table>

            </div>

          </div>
        )}

      </section>

    </div>
  );
}

export default Reports;
