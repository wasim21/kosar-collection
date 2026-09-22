const express = require("express");

const router = express.Router();

/*
==================================================
IST DATE HELPER
==================================================
*/

const getISTMonthInfo = () => {
  const istDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
  }).format(new Date());

  const [year, month] = istDate.split("-").map(Number);

  let previousYear = year;
  let previousMonth = month - 1;

  if (previousMonth === 0) {
    previousMonth = 12;
    previousYear -= 1;
  }

  return {
    currentYear: year,
    currentMonth: month,
    previousYear,
    previousMonth,
  };
};

/*
==================================================
MONTHLY BUSINESS REPORT
==================================================
*/

router.get("/monthly", async (req, res) => {
  try {
    // Monthly sales
    const [sales] = await req.db.query(`
      SELECT
        YEAR(sale_date) AS year,
        MONTH(sale_date) AS month,
        COALESCE(SUM(total_amount), 0) AS sales,
        COALESCE(SUM(total_cost), 0) AS cost,
        COALESCE(SUM(gross_profit), 0) AS gross_profit
      FROM sales
      GROUP BY YEAR(sale_date), MONTH(sale_date)
      ORDER BY year ASC, month ASC
    `);

    // Monthly expenses
    const [expenses] = await req.db.query(`
      SELECT
        YEAR(expense_date) AS year,
        MONTH(expense_date) AS month,
        COALESCE(SUM(amount), 0) AS expenses
      FROM expenses
      GROUP BY YEAR(expense_date), MONTH(expense_date)
      ORDER BY year ASC, month ASC
    `);

    const reportMap = new Map();

    // Add sales data
    sales.forEach((sale) => {
      const key = `${sale.year}-${sale.month}`;

      reportMap.set(key, {
        year: Number(sale.year),
        month: Number(sale.month),
        sales: Number(sale.sales),
        cost: Number(sale.cost),
        grossProfit: Number(sale.gross_profit),
        expenses: 0,
        netProfit: Number(sale.gross_profit),
      });
    });

    // Add expense data
    expenses.forEach((expense) => {
      const key = `${expense.year}-${expense.month}`;

      if (!reportMap.has(key)) {
        reportMap.set(key, {
          year: Number(expense.year),
          month: Number(expense.month),
          sales: 0,
          cost: 0,
          grossProfit: 0,
          expenses: Number(expense.expenses),
          netProfit: -Number(expense.expenses),
        });
      } else {
        const item = reportMap.get(key);

        item.expenses = Number(expense.expenses);
        item.netProfit =
          item.grossProfit - item.expenses;
      }
    });

    // Sort monthly report
    const report = Array.from(reportMap.values()).sort(
      (a, b) => {
        if (a.year !== b.year) {
          return a.year - b.year;
        }

        return a.month - b.month;
      }
    );

    /*
    ==============================================
    CURRENT VS PREVIOUS MONTH
    ==============================================
    */

    // Use IST instead of the server's local timezone
    const {
      currentYear,
      currentMonth,
      previousYear,
      previousMonth,
    } = getISTMonthInfo();

    const currentReport = report.find(
      (item) =>
        item.year === currentYear &&
        item.month === currentMonth
    );

    const previousReport = report.find(
      (item) =>
        item.year === previousYear &&
        item.month === previousMonth
    );

    const current = currentReport || {
      year: currentYear,
      month: currentMonth,
      sales: 0,
      cost: 0,
      grossProfit: 0,
      expenses: 0,
      netProfit: 0,
    };

    const previous = previousReport || {
      year: previousYear,
      month: previousMonth,
      sales: 0,
      cost: 0,
      grossProfit: 0,
      expenses: 0,
      netProfit: 0,
    };

    const calculateGrowth = (
      currentValue,
      previousValue
    ) => {
      if (previousValue === 0) {
        return null;
      }

      return Number(
        (
          ((currentValue - previousValue) /
            Math.abs(previousValue)) *
          100
        ).toFixed(2)
      );
    };

    const comparison = {
      currentMonth: {
        year: current.year,
        month: current.month,
        sales: current.sales,
        grossProfit: current.grossProfit,
        expenses: current.expenses,
        netProfit: current.netProfit,
      },

      previousMonth: {
        year: previous.year,
        month: previous.month,
        sales: previous.sales,
        grossProfit: previous.grossProfit,
        expenses: previous.expenses,
        netProfit: previous.netProfit,
      },

      salesGrowth: calculateGrowth(
        current.sales,
        previous.sales
      ),

      profitGrowth: calculateGrowth(
        current.netProfit,
        previous.netProfit
      ),
    };

    /*
    ==============================================
    BEST PERFORMING MONTH
    ==============================================
    */

    let bestMonth = null;

    if (report.length > 0) {
      bestMonth = report.reduce(
        (best, item) => {
          if (
            !best ||
            item.netProfit > best.netProfit
          ) {
            return item;
          }

          return best;
        },
        null
      );
    }

    res.json({
      success: true,
      report,
      comparison,
      bestMonth,
    });
  } catch (error) {
    console.error(
      "Monthly report error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message: "Failed to generate monthly report",
      error: error.message,
    });
  }
});

/*
==================================================
CATEGORY PERFORMANCE REPORT
==================================================
*/

router.get(
  "/category-performance",
  async (req, res) => {
    try {
      const [categories] = await req.db.query(`
        SELECT
          category,
          COALESCE(SUM(quantity), 0) AS items_sold,
          COALESCE(SUM(total_amount), 0) AS sales,
          COALESCE(SUM(total_cost), 0) AS cost,
          COALESCE(SUM(gross_profit), 0) AS gross_profit
        FROM sales
        GROUP BY category
        ORDER BY sales DESC
      `);

      const formattedCategories =
        categories.map((item) => {
          const sales = Number(item.sales);
          const cost = Number(item.cost);
          const grossProfit =
            Number(item.gross_profit);

          const profitMargin =
            sales > 0
              ? Number(
                  (
                    (grossProfit / sales) *
                    100
                  ).toFixed(2)
                )
              : 0;

          return {
            category: item.category,
            itemsSold: Number(item.items_sold),
            sales,
            cost,
            grossProfit,
            profitMargin,
          };
        });

      /*
      ============================================
      BEST SELLING CATEGORY
      ============================================
      */

      let bestSelling = null;

      if (formattedCategories.length > 0) {
        bestSelling =
          formattedCategories.reduce(
            (best, item) => {
              if (
                !best ||
                item.itemsSold >
                  best.itemsSold
              ) {
                return item;
              }

              return best;
            },
            null
          );
      }

      /*
      ============================================
      SLOW SELLING CATEGORY
      ============================================
      */

      let slowSelling = null;

      if (formattedCategories.length > 0) {
        slowSelling =
          formattedCategories.reduce(
            (slow, item) => {
              if (
                !slow ||
                item.itemsSold <
                  slow.itemsSold
              ) {
                return item;
              }

              return slow;
            },
            null
          );
      }

      /*
      ============================================
      MOST PROFITABLE CATEGORY
      ============================================
      */

      let mostProfitable = null;

      if (formattedCategories.length > 0) {
        mostProfitable =
          formattedCategories.reduce(
            (best, item) => {
              if (
                !best ||
                item.grossProfit >
                  best.grossProfit
              ) {
                return item;
              }

              return best;
            },
            null
          );
      }

      res.json({
        success: true,

        categories:
          formattedCategories,

        bestSelling,

        slowSelling,

        mostProfitable,
      });
    } catch (error) {
      console.error(
        "Category performance error:",
        error.message
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to generate category performance report",
        error: error.message,
      });
    }
  }
);

/*
==================================================
PRODUCT PERFORMANCE REPORT
==================================================
*/

router.get(
  "/product-performance",
  async (req, res) => {
    try {
      const [products] = await req.db.query(`
        SELECT
          p.id,
          p.product_name,
          p.category,
          p.current_stock,
          p.minimum_stock,

          COALESCE(SUM(s.quantity), 0) AS items_sold,

          COALESCE(SUM(s.total_amount), 0) AS sales,

          COALESCE(SUM(s.total_cost), 0) AS cost,

          COALESCE(SUM(s.gross_profit), 0) AS gross_profit,

          MAX(s.sale_date) AS last_sale_date

        FROM products p

        LEFT JOIN sales s
          ON p.id = s.product_id

        GROUP BY
          p.id,
          p.product_name,
          p.category,
          p.current_stock,
          p.minimum_stock

        ORDER BY items_sold DESC
      `);

      const formattedProducts = products.map(
        (item) => {
          const sales = Number(item.sales);
          const cost = Number(item.cost);
          const grossProfit =
            Number(item.gross_profit);

          const itemsSold =
            Number(item.items_sold);

          const profitMargin =
            sales > 0
              ? Number(
                  (
                    (grossProfit / sales) *
                    100
                  ).toFixed(2)
                )
              : 0;

          const currentStock =
            Number(item.current_stock);

          const minimumStock =
            Number(item.minimum_stock);

          return {
            id: item.id,
            productName: item.product_name,
            category: item.category,

            currentStock,
            minimumStock,

            itemsSold,

            sales,
            cost,
            grossProfit,
            profitMargin,

            lastSaleDate:
              item.last_sale_date,

            lowStock:
              currentStock <= minimumStock,

            noSales:
              itemsSold === 0,
          };
        }
      );

      /*
      ==============================================
      BEST SELLING PRODUCT
      ==============================================
      */

      let bestSelling = null;

      if (formattedProducts.length > 0) {
        bestSelling =
          formattedProducts.reduce(
            (best, item) => {
              if (
                !best ||
                item.itemsSold >
                  best.itemsSold
              ) {
                return item;
              }

              return best;
            },
            null
          );
      }

      /*
      ==============================================
      SLOW MOVING PRODUCT
      ==============================================
      */

      const productsWithSales =
        formattedProducts.filter(
          (item) => item.itemsSold > 0
        );

      let slowMoving = null;

      if (productsWithSales.length > 0) {
        slowMoving =
          productsWithSales.reduce(
            (slow, item) => {
              if (
                !slow ||
                item.itemsSold <
                  slow.itemsSold
              ) {
                return item;
              }

              return slow;
            },
            null
          );
      }

      /*
      ==============================================
      MOST PROFITABLE PRODUCT
      ==============================================
      */

      let mostProfitable = null;

      if (productsWithSales.length > 0) {
        mostProfitable =
          productsWithSales.reduce(
            (best, item) => {
              if (
                !best ||
                item.grossProfit >
                  best.grossProfit
              ) {
                return item;
              }

              return best;
            },
            null
          );
      }

      /*
      ==============================================
      LOW STOCK PRODUCTS
      ==============================================
      */

      const lowStockProducts =
        formattedProducts.filter(
          (item) => item.lowStock
        );

      /*
      ==============================================
      PRODUCTS WITH NO SALES
      ==============================================
      */

      const noSalesProducts =
        formattedProducts.filter(
          (item) => item.noSales
        );

      res.json({
        success: true,

        products:
          formattedProducts,

        bestSelling,

        slowMoving,

        mostProfitable,

        lowStockProducts,

        noSalesProducts,
      });
    } catch (error) {
      console.error(
        "Product performance error:",
        error.message
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to generate product performance report",
        error: error.message,
      });
    }
  }
);

module.exports = router;
