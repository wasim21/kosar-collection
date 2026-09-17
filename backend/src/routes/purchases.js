const express = require("express");

const router = express.Router();


// GET all purchases
router.get("/", async (req, res) => {
  try {
    const [purchases] = await req.db.query(`
      SELECT
        pu.id,
        pu.supplier_name,
        pu.product_id,
        p.product_name,
        pu.category,
        pu.quantity,
        pu.purchase_price,
        pu.total_amount,
        pu.payment_method,
        pu.purchase_date,
        pu.notes,
        pu.created_at
      FROM purchases pu
      JOIN products p ON pu.product_id = p.id
      ORDER BY pu.id DESC
    `);

    res.json({
      success: true,
      purchases,
    });
  } catch (error) {
    console.error("Get purchases error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch purchases",
      error: error.message,
    });
  }
});


// GET products for purchase
router.get("/products", async (req, res) => {
  try {
    const [products] = await req.db.query(`
      SELECT
        id,
        product_name,
        category,
        purchase_price,
        selling_price,
        current_stock
      FROM products
      ORDER BY product_name ASC
    `);

    res.json({
      success: true,
      products,
    });
  } catch (error) {
    console.error("Get purchase products error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch products",
      error: error.message,
    });
  }
});


// ADD PURCHASE
router.post("/", async (req, res) => {
  const connection = await req.db.getConnection();

  try {
    const {
      supplier_name,
      product_id,
      quantity,
      purchase_price,
      payment_method,
      purchase_date,
      notes,
    } = req.body;

    if (
      !supplier_name ||
      !product_id ||
      !quantity ||
      purchase_price === undefined ||
      !payment_method ||
      !purchase_date
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Supplier, product, quantity, purchase price, payment method and purchase date are required",
      });
    }

    if (Number(quantity) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be greater than 0",
      });
    }

    if (Number(purchase_price) < 0) {
      return res.status(400).json({
        success: false,
        message: "Purchase price cannot be negative",
      });
    }

    await connection.beginTransaction();

    // Check product
    const [products] = await connection.query(
      `SELECT
        id,
        product_name,
        category,
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

    const qty = Number(quantity);
    const price = Number(purchase_price);
    const totalAmount = qty * price;

    // Insert purchase
    const [purchaseResult] = await connection.query(
      `INSERT INTO purchases
      (
        supplier_name,
        product_id,
        category,
        quantity,
        purchase_price,
        total_amount,
        payment_method,
        purchase_date,
        notes
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        supplier_name,
        product.id,
        product.category,
        qty,
        price,
        totalAmount,
        payment_method,
        purchase_date,
        notes || null,
      ]
    );

    // Increase inventory
    await connection.query(
      `UPDATE products
       SET current_stock = current_stock + ?,
           purchase_price = ?
       WHERE id = ?`,
      [qty, price, product.id]
    );

    await connection.commit();

    res.status(201).json({
      success: true,
      message: "Purchase recorded successfully",
      purchase: {
        id: purchaseResult.insertId,
        supplier_name,
        product_id: product.id,
        product_name: product.product_name,
        category: product.category,
        quantity: qty,
        purchase_price: price,
        total_amount: totalAmount,
        payment_method,
        purchase_date,
        notes: notes || null,
      },
    });
  } catch (error) {
    await connection.rollback();

    console.error("Add purchase error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to record purchase",
      error: error.message,
    });
  } finally {
    connection.release();
  }
});


// DELETE PURCHASE
router.delete("/:id", async (req, res) => {
  const connection = await req.db.getConnection();

  try {
    await connection.beginTransaction();

    // Find purchase
    const [purchases] = await connection.query(
      `SELECT product_id, quantity
       FROM purchases
       WHERE id = ?`,
      [req.params.id]
    );

    if (purchases.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message: "Purchase not found",
      });
    }

    const purchase = purchases[0];

    // Check current stock before removing purchased quantity
    const [products] = await connection.query(
      `SELECT current_stock
       FROM products
       WHERE id = ?
       FOR UPDATE`,
      [purchase.product_id]
    );

    if (products.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (Number(products[0].current_stock) < Number(purchase.quantity)) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message:
          "Purchase cannot be deleted because the available stock is lower than the purchased quantity.",
      });
    }

    // Reduce inventory
    await connection.query(
      `UPDATE products
       SET current_stock = current_stock - ?
       WHERE id = ?`,
      [purchase.quantity, purchase.product_id]
    );

    // Delete purchase
    await connection.query(
      `DELETE FROM purchases
       WHERE id = ?`,
      [req.params.id]
    );

    await connection.commit();

    res.json({
      success: true,
      message: "Purchase deleted and stock adjusted successfully",
    });
  } catch (error) {
    await connection.rollback();

    console.error("Delete purchase error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to delete purchase",
      error: error.message,
    });
  } finally {
    connection.release();
  }
});


module.exports = router;