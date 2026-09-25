const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");

require("dotenv").config();

const productsRoutes = require("./routes/products");
const salesRoutes = require("./routes/sales");
const purchasesRoutes = require("./routes/purchases");
const expensesRoutes = require("./routes/expenses");
const reportsRoutes = require("./routes/reports");

const app = express();
const PORT = process.env.PORT || 5000;

/* =========================
   CORS
========================= */

const allowedOrigins = [
  "https://wasim21.github.io",
  "http://localhost:5173",
  "http://localhost:5174",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(
        new Error("Origin not allowed by CORS")
      );
    },
  })
);

app.use(express.json());

/* =========================
   DATABASE
========================= */

const db = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  ssl:
    process.env.DB_SSL === "true"
      ? {
          rejectUnauthorized: false,
        }
      : undefined,

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

/* =========================
   DATABASE MIDDLEWARE
========================= */

app.use((req, res, next) => {
  req.db = db;
  next();
});

/* =========================
   IST DATE HELPERS
========================= */

const getISTDate = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
  }).format(new Date());

const getISTMonthInfo = () => {
  const today = getISTDate();

  const [year, month] = today
    .split("-")
    .map(Number);

  const currentMonthStart =
    `${year}-${String(month).padStart(2, "0")}-01`;

  let previousYear = year;
  let previousMonth = month - 1;

  if (previousMonth === 0) {
    previousMonth = 12;
    previousYear--;
  }

  const previousMonthStart =
    `${previousYear}-${String(previousMonth).padStart(2, "0")}-01`;

  return {
    today,
    currentMonthStart,
    previousMonthStart,
    currentYear: year,
    currentMonth: month,
    previousYear,
    previousMonth,
  };
};

/* =========================
   AUTHENTICATION
========================= */

const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,

  max: 10,

  standardHeaders: true,

  legacyHeaders: false,

  message: {
    success: false,
    message:
      "Too many login attempts. Please try again after 15 minutes.",
  },
});

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error(
    "ERROR: JWT_SECRET is not configured."
  );
}

/* =========================
   CREATE USERS TABLE
========================= */

const initializeUsersTable = async () => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log(
      "Users table is ready."
    );

    const adminUsername =
      process.env.ADMIN_USERNAME;

    const adminPassword =
      process.env.ADMIN_PASSWORD;

    if (!adminUsername || !adminPassword) {
      console.warn(
        "ADMIN_USERNAME or ADMIN_PASSWORD is not configured. Admin user was not created."
      );

      return;
    }

    const [existingUsers] =
      await db.query(
        `
        SELECT id
        FROM users
        WHERE username = ?
        LIMIT 1
        `,
        [adminUsername]
      );

    if (existingUsers.length === 0) {
      const passwordHash =
        await bcrypt.hash(
          adminPassword,
          12
        );

      await db.query(
        `
        INSERT INTO users
          (username, password_hash)
        VALUES
          (?, ?)
        `,
        [
          adminUsername,
          passwordHash,
        ]
      );

      console.log(
        `Admin user "${adminUsername}" created successfully.`
      );
    } else {
      const passwordHash =
        await bcrypt.hash(
          adminPassword,
          12
        );

      await db.query(
        `
        UPDATE users
        SET password_hash = ?
        WHERE username = ?
        `,
        [
          passwordHash,
          adminUsername,
        ]
      );

      console.log(
        `Admin user "${adminUsername}" password synchronized successfully.`
      );
    }
  } catch (error) {
    console.error(
      "User table initialization error:",
      error.message
    );

    throw error;
  }
};

/* =========================
   AUTH MIDDLEWARE
========================= */

const authenticateToken = (
  req,
  res,
  next
) => {
  const authHeader =
    req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: "Authentication required.",
    });
  }

  const parts =
    authHeader.split(" ");

  if (
    parts.length !== 2 ||
    parts[0] !== "Bearer"
  ) {
    return res.status(401).json({
      success: false,
      message:
        "Invalid authentication format.",
    });
  }

  const token = parts[1];

  try {
    const decoded =
      jwt.verify(
        token,
        JWT_SECRET
      );

    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message:
        "Invalid or expired authentication token.",
    });
  }
};

/* =========================
   AUTH LOGIN
========================= */

app.post(
  "/api/auth/login",
  loginRateLimiter,
  async (req, res) => {
    try {
      const {
        username,
        password,
      } = req.body;

      if (
        !username ||
        !password
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Username and password are required.",
        });
      }

      const [users] =
        await db.query(
          `
          SELECT
            id,
            username,
            password_hash
          FROM users
          WHERE username = ?
          LIMIT 1
          `,
          [username]
        );

      if (users.length === 0) {
        return res.status(401).json({
          success: false,
          message:
            "Invalid username or password.",
        });
      }

      const user = users[0];

      const passwordMatches =
        await bcrypt.compare(
          password,
          user.password_hash
        );

      if (!passwordMatches) {
        return res.status(401).json({
          success: false,
          message:
            "Invalid username or password.",
        });
      }

      if (!JWT_SECRET) {
        return res.status(500).json({
          success: false,
          message:
            "Authentication service is not configured.",
        });
      }

      const token =
        jwt.sign(
          {
            userId: user.id,
            username: user.username,
          },
          JWT_SECRET,
          {
            expiresIn: "7d",
          }
        );

      res.json({
        success: true,
        message: "Login successful.",
        token,
        user: {
          id: user.id,
          username: user.username,
        },
      });
    } catch (error) {
      console.error(
        "Login error:",
        error.message
      );

      res.status(500).json({
        success: false,
        message:
          "Login failed.",
      });
    }
  }
);

/* =========================
   AUTH CHECK
========================= */

app.get(
  "/api/auth/me",
  authenticateToken,
  (req, res) => {
    res.json({
      success: true,
      user: req.user,
    });
  }
);

/* =========================
   PROTECTED API ROUTES
========================= */

app.use(
  "/api/products",
  authenticateToken,
  productsRoutes
);

app.use(
  "/api/sales",
  authenticateToken,
  salesRoutes
);

app.use(
  "/api/purchases",
  authenticateToken,
  purchasesRoutes
);

app.use(
  "/api/expenses",
  authenticateToken,
  expensesRoutes
);

app.use(
  "/api/reports",
  authenticateToken,
  reportsRoutes
);

/* =========================
   HOME
========================= */

app.get("/", (req, res) => {
  res.json({
    message:
      "KOSAR COLLECTION API is running",
  });
});

/* =========================
   DATABASE TEST
========================= */

app.get(
  "/api/test-db",
  authenticateToken,
  async (req, res) => {
    try {
      const [rows] =
        await db.query(
          "SELECT DATABASE() AS database_name"
        );

      res.json({
        success: true,
        message:
          "MySQL connected successfully",
        database:
          rows[0].database_name,
      });
    } catch (error) {
      console.error(
        "Database error:",
        error.message
      );

      res.status(500).json({
        success: false,
        message:
          "Database connection failed",
        error: error.message,
      });
    }
  }
);

/* =========================
   DASHBOARD
========================= */

app.get(
  "/api/dashboard",
  authenticateToken,
  async (req, res) => {
    try {
      const {
        today,
        currentMonthStart,
        previousMonthStart,
      } = getISTMonthInfo();

      const [[todaySales]] =
        await db.query(
          `
          SELECT
            COALESCE(
              SUM(total_amount),
              0
            ) AS total
          FROM sales
          WHERE sale_date = ?
          `,
          [today]
        );

      const [[todayGrossProfit]] =
        await db.query(
          `
          SELECT
            COALESCE(
              SUM(gross_profit),
              0
            ) AS total
          FROM sales
          WHERE sale_date = ?
          `,
          [today]
        );

      const [[todayExpenses]] =
        await db.query(
          `
          SELECT
            COALESCE(
              SUM(amount),
              0
            ) AS total
          FROM expenses
          WHERE expense_date = ?
          `,
          [today]
        );

      const todayNetProfit =
        Number(
          todayGrossProfit.total
        ) -
        Number(
          todayExpenses.total
        );

      const [[monthSales]] =
        await db.query(
          `
          SELECT
            COALESCE(
              SUM(total_amount),
              0
            ) AS total
          FROM sales
          WHERE sale_date >= ?
            AND sale_date <
              DATE_ADD(
                ?,
                INTERVAL 1 MONTH
              )
          `,
          [
            currentMonthStart,
            currentMonthStart,
          ]
        );

      const [[monthGrossProfit]] =
        await db.query(
          `
          SELECT
            COALESCE(
              SUM(gross_profit),
              0
            ) AS total
          FROM sales
          WHERE sale_date >= ?
            AND sale_date <
              DATE_ADD(
                ?,
                INTERVAL 1 MONTH
              )
          `,
          [
            currentMonthStart,
            currentMonthStart,
          ]
        );

      const [[monthExpenses]] =
        await db.query(
          `
          SELECT
            COALESCE(
              SUM(amount),
              0
            ) AS total
          FROM expenses
          WHERE expense_date >= ?
            AND expense_date <
              DATE_ADD(
                ?,
                INTERVAL 1 MONTH
              )
          `,
          [
            currentMonthStart,
            currentMonthStart,
          ]
        );

      const monthNetProfit =
        Number(
          monthGrossProfit.total
        ) -
        Number(
          monthExpenses.total
        );

      const [[previousMonthSales]] =
        await db.query(
          `
          SELECT
            COALESCE(
              SUM(total_amount),
              0
            ) AS total
          FROM sales
          WHERE sale_date >= ?
            AND sale_date <
              DATE_ADD(
                ?,
                INTERVAL 1 MONTH
              )
          `,
          [
            previousMonthStart,
            previousMonthStart,
          ]
        );

      const [[previousMonthGrossProfit]] =
        await db.query(
          `
          SELECT
            COALESCE(
              SUM(gross_profit),
              0
            ) AS total
          FROM sales
          WHERE sale_date >= ?
            AND sale_date <
              DATE_ADD(
                ?,
                INTERVAL 1 MONTH
              )
          `,
          [
            previousMonthStart,
            previousMonthStart,
          ]
        );

      const [[previousMonthExpenses]] =
        await db.query(
          `
          SELECT
            COALESCE(
              SUM(amount),
              0
            ) AS total
          FROM expenses
          WHERE expense_date >= ?
            AND expense_date <
              DATE_ADD(
                ?,
                INTERVAL 1 MONTH
              )
          `,
          [
            previousMonthStart,
            previousMonthStart,
          ]
        );

      const previousMonthNetProfit =
        Number(
          previousMonthGrossProfit.total
        ) -
        Number(
          previousMonthExpenses.total
        );

      let salesGrowth = null;

      if (
        Number(
          previousMonthSales.total
        ) > 0
      ) {
        salesGrowth =
          Number(
            (
              (
                Number(
                  monthSales.total
                ) -
                Number(
                  previousMonthSales.total
                )
              ) /
              Number(
                previousMonthSales.total
              ) *
              100
            ).toFixed(2)
          );
      }

      let profitGrowth = null;

      if (
        Number(
          previousMonthNetProfit
        ) !== 0
      ) {
        profitGrowth =
          Number(
            (
              (
                Number(
                  monthNetProfit
                ) -
                Number(
                  previousMonthNetProfit
                )
              ) /
              Math.abs(
                Number(
                  previousMonthNetProfit
                )
              ) *
              100
            ).toFixed(2)
          );
      }

      const [[stock]] =
        await db.query(`
          SELECT
            COALESCE(
              SUM(current_stock),
              0
            ) AS total
          FROM products
        `);

      const [[lowStock]] =
        await db.query(`
          SELECT
            COUNT(*) AS total
          FROM products
          WHERE current_stock <= minimum_stock
        `);

      const [bestCategory] =
        await db.query(`
          SELECT
            category,
            SUM(quantity) AS items_sold
          FROM sales
          GROUP BY category
          ORDER BY items_sold DESC
          LIMIT 1
        `);

      const [bestProduct] =
        await db.query(`
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

      const [lowStockProducts] =
        await db.query(`
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

      let insight =
        "Start recording sales and expenses to generate business insights.";

      if (
        Number(
          monthSales.total
        ) > 0
      ) {
        if (
          Number(
            monthNetProfit
          ) > 0
        ) {
          insight =
            "Your shop is currently generating a positive net profit this month. Continue monitoring your best-selling products and maintain sufficient stock.";
        } else if (
          Number(
            monthNetProfit
          ) < 0
        ) {
          insight =
            "Your current monthly expenses are higher than your gross profit. Review expenses and focus on higher-margin products.";
        } else {
          insight =
            "Your shop is currently at break-even after expenses. Monitor product margins and operating costs carefully.";
        }
      }

      if (
        Number(
          lowStock.total
        ) > 0
      ) {
        insight += ` ${Number(
          lowStock.total
        )} product(s) are currently at or below the minimum stock level.`;
      }

      if (
        bestCategory.length > 0
      ) {
        insight += ` ${bestCategory[0].category} is currently your best-selling category.`;
      }

      res.json({
        success: true,

        dashboard: {
          todaySales:
            Number(
              todaySales.total
            ),

          todayGrossProfit:
            Number(
              todayGrossProfit.total
            ),

          todayExpenses:
            Number(
              todayExpenses.total
            ),

          todayNetProfit,

          monthSales:
            Number(
              monthSales.total
            ),

          monthGrossProfit:
            Number(
              monthGrossProfit.total
            ),

          monthExpenses:
            Number(
              monthExpenses.total
            ),

          monthNetProfit,

          previousMonthSales:
            Number(
              previousMonthSales.total
            ),

          previousMonthNetProfit,

          salesGrowth,

          profitGrowth,

          availableStock:
            Number(
              stock.total
            ),

          lowStockItems:
            Number(
              lowStock.total
            ),

          bestSellingCategory:
            bestCategory.length
              ? bestCategory[0]
                  .category
              : "No sales yet",

          bestSellingProduct:
            bestProduct.length
              ? {
                  productName:
                    bestProduct[0]
                      .product_name,

                  itemsSold:
                    Number(
                      bestProduct[0]
                        .items_sold
                    ),

                  sales:
                    Number(
                      bestProduct[0]
                        .sales
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
        message:
          "Failed to load dashboard data",
        error: error.message,
      });
    }
  }
);

/* =========================
   START SERVER
========================= */

const startServer = async () => {
  try {
    await initializeUsersTable();

    app.listen(
      PORT,
      "0.0.0.0",
      () => {
        console.log(
          `KOSAR COLLECTION API running on port ${PORT}`
        );
      }
    );
  } catch (error) {
    console.error(
      "Server startup failed:",
      error.message
    );

    process.exit(1);
  }
};

startServer();
