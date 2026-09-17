const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
require("dotenv").config();

const productsRoutes = require("./routes/products");
const salesRoutes = require("./routes/sales");
const purchasesRoutes = require("./routes/purchases");
const expensesRoutes = require("./routes/expenses");
const reportsRoutes = require("./routes/reports");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

app.use((req, res, next) => {
  req.db = db;
  next();
});

/* =========================
   API ROUTES
========================= */

app.use("/api/products", productsRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/purchases", purchasesRoutes);
app.use("/api/expenses", expensesRoutes);
app.use("/api/reports", reportsRoutes);

/* =========================
   HOME
========================= */

app.get("/", (req, res) => {
  res.json({
    message: "KOSAR COLLECTION API is running",
  });
});

/* =========================
   DATABASE TEST
========================= */

app.get("/api/test-db", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT DATABASE() AS database_name"
    );

    res.json({
      success: true,
      message: "MySQL connected successfully",
      database: rows[0].database_name,
    });
  } catch (error) {
    console.error("Database error:", error.message);

    res.status(500).json({
      success: false,
      message: "Database connection failed",
      error: error.message,
    });
  }
});

/* =========================
   DASHBOARD
========================= */

app.get("/api/dashboard", async (req, res) => {
  try {
    /* -------------------------
       TODAY'S SALES
    ------------------------- */

    const [[todaySales]] = await db.query(`
      SELECT
        COALESCE(SUM(total_amount), 0) AS total
      FROM sales
      WHERE sale_date = CURDATE()
    `);

    /* -------------------------
       TODAY'S GROSS PROFIT
    ------------------------- */

    const [[todayGrossProfit]] = await db.query(`
      SELECT
        COALESCE(SUM(gross_profit), 0) AS total
      FROM sales
      WHERE sale_date = CURDATE()
    `);

    /* -------------------------
       TODAY'S EXPENSES
    ------------------------- */

    const [[todayExpenses]] = await db.query(`
      SELECT
        COALESCE(SUM(amount), 0) AS total
      FROM expenses
      WHERE expense_date = CURDATE()
    `);

    /* -------------------------
       TODAY'S NET PROFIT
    ------------------------- */

    const todayNetProfit =
      Number(todayGrossProfit.total) -
      Number(todayExpenses.total);

    /* -------------------------
       CURRENT MONTH SALES
    ------------------------- */

    const [[monthSales]] = await db.query(`
      SELECT
        COALESCE(SUM(total_amount), 0) AS total
      FROM sales
      WHERE YEAR(sale_date) = YEAR(CURDATE())
        AND MONTH(sale_date) = MONTH(CURDATE())
    `);

    /* -------------------------
       CURRENT MONTH GROSS PROFIT
    ------------------------- */

    const [[monthGrossProfit]] = await db.query(`
      SELECT
        COALESCE(SUM(gross_profit), 0) AS total
      FROM sales
      WHERE YEAR(sale_date) = YEAR(CURDATE())
        AND MONTH(sale_date) = MONTH(CURDATE())
    `);

    /* -------------------------
       CURRENT MONTH EXPENSES
    ------------------------- */

    const [[monthExpenses]] = await db.query(`
      SELECT
        COALESCE(SUM(amount), 0) AS total
      FROM expenses
      WHERE YEAR(expense_date) = YEAR(CURDATE())
        AND MONTH(expense_date) = MONTH(CURDATE())
    `);

    /* -------------------------
       CURRENT MONTH NET PROFIT
    ------------------------- */

    const monthNetProfit =
      Number(monthGrossProfit.total) -
      Number(monthExpenses.total);

    /* -------------------------
       PREVIOUS MONTH SALES
    ------------------------- */

    const [[previousMonthSales]] = await db.query(`
      SELECT
        COALESCE(SUM(total_amount), 0) AS total
      FROM sales
      WHERE YEAR(sale_date) = YEAR(
        DATE_SUB(CURDATE(), INTERVAL 1 MONTH)
      )
      AND MONTH(sale_date) = MONTH(
        DATE_SUB(CURDATE(), INTERVAL 1 MONTH)
      )
    `);

    /* -------------------------
       PREVIOUS MONTH NET PROFIT
    ------------------------- */

    const [[previousMonthGrossProfit]] = await db.query(`
      SELECT
        COALESCE(SUM(gross_profit), 0) AS total
      FROM sales
      WHERE YEAR(sale_date) = YEAR(
        DATE_SUB(CURDATE(), INTERVAL 1 MONTH)
      )
      AND MONTH(sale_date) = MONTH(
        DATE_SUB(CURDATE(), INTERVAL 1 MONTH)
      )
    `);

    const [[previousMonthExpenses]] = await db.query(`
      SELECT
        COALESCE(SUM(amount), 0) AS total
      FROM expenses
      WHERE YEAR(expense_date) = YEAR(
        DATE_SUB(CURDATE(), INTERVAL 1 MONTH)
      )
      AND MONTH(expense_date) = MONTH(
        DATE_SUB(CURDATE(), INTERVAL 1 MONTH)
      )
    `);

    const previousMonthNetProfit =
      Number(previousMonthGrossProfit.total) -
      Number(previousMonthExpenses.total);

    /* -------------------------
       SALES GROWTH
    ------------------------- */

    let salesGrowth = null;

    if (Number(previousMonthSales.total) > 0) {
      salesGrowth = Number(
        (
          ((Number(monthSales.total) -
            Number(previousMonthSales.total)) /
            Number(previousMonthSales.total)) *
          100
        ).toFixed(2)
      );
    }

    /* -------------------------
       PROFIT GROWTH
    ------------------------- */

    let profitGrowth = null;

    if (Number(previousMonthNetProfit) !== 0) {
      profitGrowth = Number(
        (
          ((Number(monthNetProfit) -
            Number(previousMonthNetProfit)) /
            Math.abs(Number(previousMonthNetProfit))) *
          100
        ).toFixed(2)
      );
    }

    /* -------------------------
       AVAILABLE STOCK
    ------------------------- */

    const [[stock]] = await db.query(`
      SELECT
        COALESCE(SUM(current_stock), 0) AS total
      FROM products
    `);

    /* -------------------------
       LOW STOCK ITEMS
    ------------------------- */

    const [[lowStock]] = await db.query(`
      SELECT
        COUNT(*) AS total
      FROM products
      WHERE current_stock <= minimum_stock
    `);

    /* -------------------------
       BEST SELLING CATEGORY
    ------------------------- */

    const [bestCategory] = await db.query(`
      SELECT
        category,
        SUM(quantity) AS items_sold
      FROM sales
      GROUP BY category
      ORDER BY items_sold DESC
      LIMIT 1
    `);

    /* -------------------------
       BEST SELLING PRODUCT
    ------------------------- */

    const [bestProduct] = await db.query(`
      SELECT
        s.product_id,
        p.product_name,
        SUM(s.quantity) AS items_sold,
        SUM(s.total_amount) AS sales
      FROM sales s
      INNER JOIN products p
        ON s.product_id = p.id
      GROUP BY
        s.product_id,
        p.product_name
      ORDER BY items_sold DESC
      LIMIT 1
    `);

    /* -------------------------
       LOW STOCK PRODUCT LIST
    ------------------------- */

    const [lowStockProducts] = await db.query(`
      SELECT
        id,
        product_name,
        category,
        current_stock,
        minimum_stock
      FROM products
      WHERE current_stock <= minimum_stock
      ORDER BY current_stock ASC
    `);

    /* -------------------------
       SMART BUSINESS INSIGHT
    ------------------------- */

    let insight =
      "Start recording sales and expenses to generate business insights.";

    if (Number(monthSales.total) > 0) {
      if (Number(monthNetProfit) > 0) {
        insight =
          "Your shop is currently generating a positive net profit this month. Continue monitoring your best-selling products and maintain sufficient stock.";
      } else if (Number(monthNetProfit) < 0) {
        insight =
          "Your current monthly expenses are higher than your gross profit. Review expenses and focus on higher-margin products.";
      } else {
        insight =
          "Your shop is currently at break-even after expenses. Monitor product margins and operating costs carefully.";
      }
    }

    if (Number(lowStock.total) > 0) {
      insight += ` ${Number(
        lowStock.total
      )} product(s) are currently at or below the minimum stock level.`;
    }

    if (bestCategory.length > 0) {
      insight += ` ${bestCategory[0].category} is currently your best-selling category.`;
    }

    /* -------------------------
       RESPONSE
    ------------------------- */

    res.json({
      success: true,

      dashboard: {
        todaySales: Number(todaySales.total),

        todayGrossProfit: Number(
          todayGrossProfit.total
        ),

        todayExpenses: Number(
          todayExpenses.total
        ),

        todayNetProfit,

        monthSales: Number(
          monthSales.total
        ),

        monthGrossProfit: Number(
          monthGrossProfit.total
        ),

        monthExpenses: Number(
          monthExpenses.total
        ),

        monthNetProfit,

        previousMonthSales: Number(
          previousMonthSales.total
        ),

        previousMonthNetProfit,

        salesGrowth,

        profitGrowth,

        availableStock: Number(
          stock.total
        ),

        lowStockItems: Number(
          lowStock.total
        ),

        bestSellingCategory:
          bestCategory.length
            ? bestCategory[0].category
            : "No sales yet",

        bestSellingProduct:
          bestProduct.length
            ? {
                productName:
                  bestProduct[0].product_name,
                itemsSold: Number(
                  bestProduct[0].items_sold
                ),
                sales: Number(
                  bestProduct[0].sales
                ),
              }
            : null,

        lowStockProducts,

        insight,
      },
    });
  } catch (error) {
    console.error(
      "Dashboard error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message: "Failed to load dashboard data",
      error: error.message,
    });
  }
});

/* =========================
   START SERVER
========================= */

app.listen(PORT, () => {
  console.log(
    `KOSAR COLLECTION API running on http://localhost:${PORT}`
  );
});
