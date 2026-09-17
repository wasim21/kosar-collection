const express = require("express");

const router = express.Router();

// GET all sales
router.get("/", async (req, res) => {
  try {
    const [sales] = await req.db.query(`
      SELECT
        s.id,
        s.product_id,
        p.product_name,
        s.category,
        s.quantity,
        s.selling_price,
        s.total_amount,
        s.cost_price,
        s.total_cost,
        s.gross_profit,
        s.payment_method,
        s.sale_date,
        s.created_at
      FROM sales s
      JOIN products p ON s.product_id = p.id
      ORDER BY s.id DESC
    `);

    res.json({
      success: true,
      sales,
    });
  } catch (error) {
    console.error("Get sales error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch sales",
      error: error.message,
    });
  }
});


// GET available products for selling
router.get("/products", async (req, res) => {
  try {
    const [products] = await req.db.query(`
      SELECT
        id,
        product_name,
        category,
        selling_price,
        purchase_price,
        current_stock
      FROM products
      WHERE current_stock > 0
      ORDER BY product_name ASC
    `);

    res.json({
      success: true,
      products,
    });
  } catch (error) {
    console.error("Get sale products error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch products",
      error: error.message,
    });
  }
});


// ADD SALE
router.post("/", async (req, res) => {
  const connection = await req.db.getConnection();

  try {
    const {
      product_id,
      quantity,
      payment_method,
      sale_date,
    } = req.body;

    if (!product_id || !quantity || !payment_method || !sale_date) {
      return res.status(400).json({
        success: false,
        message: "Product, quantity, payment method and sale date are required",
      });
    }

    if (Number(quantity) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be greater than 0",
      });
    }

    await connection.beginTransaction();

    // Get product and lock the row
    const [products] = await connection.query(
      `SELECT
        id,
        product_name,
        category,
        purchase_price,
        selling_price,
        current_stock
       FROM products
       WHERE id = ?
       FOR UPDATE`,
      [product_id]
    );

    if (products.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const product = products[0];

    // Check stock
    if (Number(product.current_stock) < Number(quantity)) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message: `Only ${product.current_stock} item(s) available in stock`,
      });
    }

    const qty = Number(quantity);
    const sellingPrice = Number(product.selling_price);
    const costPrice = Number(product.purchase_price);

    const totalAmount = sellingPrice * qty;
    const totalCost = costPrice * qty;
    const grossProfit = totalAmount - totalCost;

    // Insert sale
    const [saleResult] = await connection.query(
      `INSERT INTO sales
      (
        product_id,
        category,
        quantity,
        selling_price,
        total_amount,
        cost_price,
        total_cost,
        gross_profit,
        payment_method,
        sale_date
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        product.id,
        product.category,
        qty,
        sellingPrice,
        totalAmount,
        costPrice,
        totalCost,
        grossProfit,
        payment_method,
        sale_date,
      ]
    );

    // Reduce inventory stock
    await connection.query(
      `UPDATE products
       SET current_stock = current_stock - ?
       WHERE id = ?`,
      [qty, product.id]
    );

    await connection.commit();

    res.status(201).json({
      success: true,
      message: "Sale recorded successfully",
      sale: {
        id: saleResult.insertId,
        product_id: product.id,
        product_name: product.product_name,
        category: product.category,
        quantity: qty,
        selling_price: sellingPrice,
        total_amount: totalAmount,
        cost_price: costPrice,
        total_cost: totalCost,
        gross_profit: grossProfit,
        payment_method,
        sale_date,
      },
    });
  } catch (error) {
    await connection.rollback();

    console.error("Add sale error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to record sale",
      error: error.message,
    });
  } finally {
    connection.release();
  }
});


// DELETE SALE
router.delete("/:id", async (req, res) => {
  const connection = await req.db.getConnection();

  try {
    await connection.beginTransaction();

    // Find the sale first
    const [sales] = await connection.query(
      `SELECT product_id, quantity
       FROM sales
       WHERE id = ?`,
      [req.params.id]
    );

    if (sales.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message: "Sale not found",
      });
    }

    const sale = sales[0];

    // Restore stock
    await connection.query(
      `UPDATE products
       SET current_stock = current_stock + ?
       WHERE id = ?`,
      [sale.quantity, sale.product_id]
    );

    // Delete sale
    await connection.query(
      `DELETE FROM sales
       WHERE id = ?`,
      [req.params.id]
    );

    await connection.commit();

    res.json({
      success: true,
      message: "Sale deleted and stock restored successfully",
    });
  } catch (error) {
    await connection.rollback();

    console.error("Delete sale error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to delete sale",
      error: error.message,
    });
  } finally {
    connection.release();
  }
});


module.exports = router;