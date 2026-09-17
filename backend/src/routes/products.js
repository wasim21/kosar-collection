const express = require("express");

const router = express.Router();

// GET all products
router.get("/", async (req, res) => {
  try {
    const [products] = await req.db.query(
      "SELECT * FROM products ORDER BY id DESC"
    );

    res.json({
      success: true,
      products,
    });
  } catch (error) {
    console.error("Get products error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch products",
      error: error.message,
    });
  }
});

// GET single product
router.get("/:id", async (req, res) => {
  try {
    const [products] = await req.db.query(
      "SELECT * FROM products WHERE id = ?",
      [req.params.id]
    );

    if (products.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.json({
      success: true,
      product: products[0],
    });
  } catch (error) {
    console.error("Get product error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch product",
      error: error.message,
    });
  }
});

// ADD product
router.post("/", async (req, res) => {
  try {
    const {
      product_name,
      category,
      purchase_price,
      selling_price,
      current_stock,
      minimum_stock,
    } = req.body;

    if (!product_name || !category) {
      return res.status(400).json({
        success: false,
        message: "Product name and category are required",
      });
    }

    const [result] = await req.db.query(
      `INSERT INTO products
      (
        product_name,
        category,
        purchase_price,
        selling_price,
        current_stock,
        minimum_stock
      )
      VALUES (?, ?, ?, ?, ?, ?)`,
      [
        product_name,
        category,
        purchase_price || 0,
        selling_price || 0,
        current_stock || 0,
        minimum_stock || 5,
      ]
    );

    const [newProduct] = await req.db.query(
      "SELECT * FROM products WHERE id = ?",
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: "Product added successfully",
      product: newProduct[0],
    });
  } catch (error) {
    console.error("Add product error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to add product",
      error: error.message,
    });
  }
});

// UPDATE product
router.put("/:id", async (req, res) => {
  try {
    const {
      product_name,
      category,
      purchase_price,
      selling_price,
      current_stock,
      minimum_stock,
    } = req.body;

    const [result] = await req.db.query(
      `UPDATE products
       SET
         product_name = ?,
         category = ?,
         purchase_price = ?,
         selling_price = ?,
         current_stock = ?,
         minimum_stock = ?
       WHERE id = ?`,
      [
        product_name,
        category,
        purchase_price,
        selling_price,
        current_stock,
        minimum_stock,
        req.params.id,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const [updatedProduct] = await req.db.query(
      "SELECT * FROM products WHERE id = ?",
      [req.params.id]
    );

    res.json({
      success: true,
      message: "Product updated successfully",
      product: updatedProduct[0],
    });
  } catch (error) {
    console.error("Update product error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to update product",
      error: error.message,
    });
  }
});

// DELETE product
router.delete("/:id", async (req, res) => {
  try {
    const [result] = await req.db.query(
      "DELETE FROM products WHERE id = ?",
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Delete product error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to delete product",
      error: error.message,
    });
  }
});

module.exports = router;