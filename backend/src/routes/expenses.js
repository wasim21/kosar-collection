const express = require("express");

const router = express.Router();

// GET all expenses
router.get("/", async (req, res) => {
  try {
    const [rows] = await req.db.query(`
      SELECT
        id,
        expense_type,
        amount,
        description,
        expense_date,
        created_at
      FROM expenses
      ORDER BY expense_date DESC, id DESC
    `);

    res.json({
      success: true,
      expenses: rows,
    });
  } catch (error) {
    console.error("Get expenses error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch expenses",
      error: error.message,
    });
  }
});

// POST new expense
router.post("/", async (req, res) => {
  try {
    const {
      expense_type,
      amount,
      description,
      expense_date,
    } = req.body;

    if (!expense_type || !amount || !expense_date) {
      return res.status(400).json({
        success: false,
        message: "Expense type, amount and date are required",
      });
    }

    if (Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Amount must be greater than zero",
      });
    }

    const [result] = await req.db.query(
      `
      INSERT INTO expenses
        (expense_type, amount, description, expense_date)
      VALUES (?, ?, ?, ?)
      `,
      [
        expense_type,
        Number(amount),
        description || null,
        expense_date,
      ]
    );

    res.status(201).json({
      success: true,
      message: "Expense added successfully",
      expenseId: result.insertId,
    });
  } catch (error) {
    console.error("Add expense error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to add expense",
      error: error.message,
    });
  }
});

// DELETE expense
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await req.db.query(
      "DELETE FROM expenses WHERE id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Expense not found",
      });
    }

    res.json({
      success: true,
      message: "Expense deleted successfully",
    });
  } catch (error) {
    console.error("Delete expense error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to delete expense",
      error: error.message,
    });
  }
});

module.exports = router;