import { useEffect, useState } from "react";
import { Plus, Trash2, Receipt } from "lucide-react";

const EXPENSES_API = "http://localhost:5000/api/expenses";

function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    expense_type: "Electricity",
    amount: "",
    description: "",
    expense_date: new Date().toISOString().split("T")[0],
  });

  const loadExpenses = async () => {
    try {
      setLoading(true);

      const response = await fetch(EXPENSES_API);
      const data = await response.json();

      if (data.success) {
        setExpenses(data.expenses);
      }
    } catch (error) {
      console.error("Failed to load expenses:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.expense_type || !form.amount || !form.expense_date) {
      alert("Please fill all required fields.");
      return;
    }

    try {
      const response = await fetch(EXPENSES_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          expense_type: form.expense_type,
          amount: Number(form.amount),
          description: form.description,
          expense_date: form.expense_date,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        alert(data.message || "Failed to add expense.");
        return;
      }

      alert("Expense added successfully.");

      setForm({
        expense_type: "Electricity",
        amount: "",
        description: "",
        expense_date: new Date().toISOString().split("T")[0],
      });

      setShowModal(false);
      loadExpenses();
    } catch (error) {
      console.error("Add expense error:", error);
      alert("Unable to add expense.");
    }
  };

  const deleteExpense = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this expense?"
    );

    if (!confirmed) return;

    try {
      const response = await fetch(`${EXPENSES_API}/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!data.success) {
        alert(data.message || "Failed to delete expense.");
        return;
      }

      loadExpenses();
    } catch (error) {
      console.error("Delete expense error:", error);
      alert("Unable to delete expense.");
    }
  };

  const totalExpenses = expenses.reduce(
    (sum, expense) => sum + Number(expense.amount || 0),
    0
  );

  const today = new Date().toISOString().split("T")[0];

  const todayExpenses = expenses
    .filter((expense) => expense.expense_date?.startsWith(today))
    .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const monthExpenses = expenses
    .filter((expense) => {
      const date = new Date(expense.expense_date);

      return (
        date.getMonth() === currentMonth &&
        date.getFullYear() === currentYear
      );
    })
    .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);

  const formatCurrency = (amount) => {
    return `₹${Number(amount || 0).toLocaleString("en-IN")}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="page">

      <div className="page-header">
        <div>
          <h1>Expenses</h1>
          <p>Manage your shop expenses</p>
        </div>

        <button
          className="primary-button"
          onClick={() => setShowModal(true)}
        >
          <Plus size={18} />
          Add Expense
        </button>
      </div>

      {/* Summary */}
      <div className="dashboard-cards">

        <div className="dashboard-card">
          <div className="dashboard-card-icon">
            <Receipt size={24} />
          </div>

          <div>
            <p>Total Expenses</p>
            <h2>{formatCurrency(totalExpenses)}</h2>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="dashboard-card-icon">
            <Receipt size={24} />
          </div>

          <div>
            <p>This Month</p>
            <h2>{formatCurrency(monthExpenses)}</h2>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="dashboard-card-icon">
            <Receipt size={24} />
          </div>

          <div>
            <p>Today's Expenses</p>
            <h2>{formatCurrency(todayExpenses)}</h2>
          </div>
        </div>

      </div>

      {/* Expense History */}
      <div className="dashboard-panel">

        <div className="panel-header">
          <div>
            <h3>Expense History</h3>
            <p>All recorded shop expenses</p>
          </div>
        </div>

        {loading ? (
          <p>Loading expenses...</p>
        ) : expenses.length === 0 ? (
          <div className="empty-state">
            No expenses recorded yet.
          </div>
        ) : (
          <div className="table-container">

            <table className="data-table">

              <thead>
                <tr>
                  <th>Date</th>
                  <th>Expense Type</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {expenses.map((expense) => (
                  <tr key={expense.id}>

                    <td>
                      {formatDate(expense.expense_date)}
                    </td>

                    <td>
                      <strong>
                        {expense.expense_type}
                      </strong>
                    </td>

                    <td>
                      {expense.description || "-"}
                    </td>

                    <td>
                      <strong>
                        {formatCurrency(expense.amount)}
                      </strong>
                    </td>

                    <td>
                      <button
                        className="delete-button"
                        onClick={() => deleteExpense(expense.id)}
                        title="Delete expense"
                      >
                        <Trash2 size={17} />
                      </button>
                    </td>

                  </tr>
                ))}
              </tbody>

            </table>

          </div>
        )}

      </div>

      {/* Add Expense Modal */}
      {showModal && (
        <div className="modal-overlay">

          <div className="modal">

            <div className="modal-header">
              <div>
                <h2>Add Expense</h2>
                <p>Record a shop expense</p>
              </div>

              <button
                className="modal-close"
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>

              <div className="form-group">
                <label>Expense Type *</label>

                <select
                  name="expense_type"
                  value={form.expense_type}
                  onChange={handleChange}
                >
                  <option>Electricity</option>
                  <option>Shop Rent</option>
                  <option>Staff Salary</option>
                  <option>Transport</option>
                  <option>Packaging</option>
                  <option>Maintenance</option>
                  <option>Marketing</option>
                  <option>Other</option>
                </select>
              </div>

              <div className="form-group">
                <label>Amount *</label>

                <input
                  type="number"
                  name="amount"
                  value={form.amount}
                  onChange={handleChange}
                  placeholder="Enter amount"
                  min="1"
                  step="0.01"
                  required
                />
              </div>

              <div className="form-group">
                <label>Description</label>

                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Enter description"
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label>Date *</label>

                <input
                  type="date"
                  name="expense_date"
                  value={form.expense_date}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="modal-actions">

                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                >
                  Save Expense
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
}

export default Expenses;