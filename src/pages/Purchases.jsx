import { useEffect, useState } from "react";
import {
  Plus,
  Search,
  Package,
  IndianRupee,
  X,
  Trash2,
} from "lucide-react";

const PURCHASES_API = "http://localhost:5000/api/purchases";

function Purchases() {
  const [purchases, setPurchases] = useState([]);
  const [products, setProducts] = useState([]);

  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    supplierName: "",
    productId: "",
    quantity: 1,
    purchasePrice: "",
    paymentMethod: "Cash",
    purchaseDate: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const fetchPurchases = async () => {
    const response = await fetch(PURCHASES_API);
    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Failed to fetch purchases");
    }

    setPurchases(data.purchases);
  };

  const fetchProducts = async () => {
    const response = await fetch(`${PURCHASES_API}/products`);
    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Failed to fetch products");
    }

    setProducts(data.products);
  };

  const loadData = async () => {
    try {
      setLoading(true);

      await Promise.all([
        fetchPurchases(),
        fetchProducts(),
      ]);
    } catch (error) {
      console.error("Load purchases error:", error);
      alert(error.message || "Unable to load purchases.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const selectedProduct = products.find(
    (product) => String(product.id) === String(form.productId)
  );

  const quantity = Number(form.quantity) || 0;
  const purchasePrice = Number(form.purchasePrice) || 0;
  const totalAmount = quantity * purchasePrice;

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleProductChange = (e) => {
    const productId = e.target.value;

    const product = products.find(
      (item) => String(item.id) === String(productId)
    );

    setForm({
      ...form,
      productId,
      purchasePrice: product
        ? product.purchase_price
        : "",
    });
  };

  const resetForm = () => {
    setForm({
      supplierName: "",
      productId: "",
      quantity: 1,
      purchasePrice: "",
      paymentMethod: "Cash",
      purchaseDate: new Date().toISOString().split("T")[0],
      notes: "",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.supplierName.trim()) {
      alert("Please enter supplier name.");
      return;
    }

    if (!form.productId) {
      alert("Please select a product.");
      return;
    }

    if (quantity <= 0) {
      alert("Quantity must be greater than 0.");
      return;
    }

    if (purchasePrice < 0) {
      alert("Purchase price cannot be negative.");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(PURCHASES_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          supplier_name: form.supplierName.trim(),
          product_id: Number(form.productId),
          quantity,
          purchase_price: purchasePrice,
          payment_method: form.paymentMethod,
          purchase_date: form.purchaseDate,
          notes: form.notes.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to record purchase");
      }

      alert(
        `Purchase recorded successfully!\nTotal: ₹${Number(
          data.purchase.total_amount
        ).toLocaleString("en-IN")}`
      );

      resetForm();
      setShowForm(false);

      await loadData();
    } catch (error) {
      console.error("Save purchase error:", error);
      alert(error.message || "Unable to record purchase.");
    } finally {
      setSaving(false);
    }
  };

  const deletePurchase = async (id) => {
    const confirmed = window.confirm(
      "Delete this purchase?\n\nThe purchased quantity will be removed from inventory."
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`${PURCHASES_API}/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to delete purchase");
      }

      alert("Purchase deleted and inventory adjusted.");

      await loadData();
    } catch (error) {
      console.error("Delete purchase error:", error);
      alert(error.message || "Unable to delete purchase.");
    }
  };

  const filteredPurchases = purchases.filter((purchase) =>
    `${purchase.product_name} ${purchase.category} ${purchase.supplier_name} ${purchase.payment_method}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const totalPurchaseAmount = purchases.reduce(
    (total, purchase) => total + Number(purchase.total_amount),
    0
  );

  const totalItemsPurchased = purchases.reduce(
    (total, purchase) => total + Number(purchase.quantity),
    0
  );

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Purchases</h1>
          <p>Manage warehouse purchases and stock additions</p>
        </div>

        <button
          className="primary-btn"
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
        >
          <Plus size={18} />
          New Purchase
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-top">
            <div>
              <p className="stat-title">Total Purchases</p>
              <h2>₹{totalPurchaseAmount.toLocaleString("en-IN")}</h2>
              <p className="stat-subtitle">
                Purchase investment recorded
              </p>
            </div>

            <div className="stat-icon">
              <IndianRupee size={24} />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <div>
              <p className="stat-title">Items Purchased</p>
              <h2>{totalItemsPurchased}</h2>
              <p className="stat-subtitle">
                Total units purchased
              </p>
            </div>

            <div className="stat-icon">
              <Package size={24} />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <div>
              <p className="stat-title">Purchase Records</p>
              <h2>{purchases.length}</h2>
              <p className="stat-subtitle">
                Transactions recorded
              </p>
            </div>

            <div className="stat-icon">
              <Package size={24} />
            </div>
          </div>
        </div>
      </div>

      <div className="table-card">
        <div className="table-header">
          <div>
            <h2>Purchase History</h2>
            <p>All recorded warehouse purchases</p>
          </div>

          <div className="search-box">
            <Search size={18} />

            <input
              type="text"
              placeholder="Search product, supplier..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="table-wrapper">
          {loading ? (
            <div className="empty-state">
              <Package size={40} />
              <h3>Loading purchases...</h3>
              <p>Please wait.</p>
            </div>
          ) : filteredPurchases.length === 0 ? (
            <div className="empty-state">
              <Package size={40} />
              <h3>No purchases found</h3>
              <p>
                Click "New Purchase" to record your first
                purchase.
              </p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Supplier</th>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Qty</th>
                  <th>Purchase Price</th>
                  <th>Total</th>
                  <th>Payment</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredPurchases.map((purchase) => (
                  <tr key={purchase.id}>
                    <td>{purchase.purchase_date}</td>

                    <td>
                      <strong>{purchase.supplier_name}</strong>
                    </td>

                    <td>{purchase.product_name}</td>

                    <td>{purchase.category}</td>

                    <td>{purchase.quantity}</td>

                    <td>
                      ₹
                      {Number(
                        purchase.purchase_price
                      ).toLocaleString("en-IN")}
                    </td>

                    <td>
                      <strong>
                        ₹
                        {Number(
                          purchase.total_amount
                        ).toLocaleString("en-IN")}
                      </strong>
                    </td>

                    <td>{purchase.payment_method}</td>

                    <td>
                      <button
                        className="icon-btn delete-btn"
                        title="Delete Purchase"
                        onClick={() =>
                          deletePurchase(purchase.id)
                        }
                      >
                        <Trash2 size={17} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <div>
                <h2>New Purchase</h2>
                <p>Add stock purchased from your supplier</p>
              </div>

              <button
                className="modal-close"
                onClick={() => {
                  resetForm();
                  setShowForm(false);
                }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label>Supplier Name</label>

                  <input
                    type="text"
                    name="supplierName"
                    placeholder="e.g. ABC Wholesale"
                    value={form.supplierName}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group full-width">
                  <label>Product</label>

                  <select
                    name="productId"
                    value={form.productId}
                    onChange={handleProductChange}
                  >
                    <option value="">
                      Select Product
                    </option>

                    {products.map((product) => (
                      <option
                        key={product.id}
                        value={product.id}
                      >
                        {product.product_name} —{" "}
                        {product.category}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedProduct && (
                  <div className="form-group">
                    <label>Current Stock</label>

                    <input
                      type="text"
                      value={selectedProduct.current_stock}
                      readOnly
                    />
                  </div>
                )}

                <div className="form-group">
                  <label>Quantity</label>

                  <input
                    type="number"
                    name="quantity"
                    min="1"
                    value={form.quantity}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label>Purchase Price / Item</label>

                  <input
                    type="number"
                    name="purchasePrice"
                    min="0"
                    step="0.01"
                    placeholder="₹ Price per item"
                    value={form.purchasePrice}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label>Payment Method</label>

                  <select
                    name="paymentMethod"
                    value={form.paymentMethod}
                    onChange={handleChange}
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="Card">Card</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Purchase Date</label>

                  <input
                    type="date"
                    name="purchaseDate"
                    value={form.purchaseDate}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group full-width">
                  <label>Notes</label>

                  <textarea
                    name="notes"
                    placeholder="Optional notes..."
                    value={form.notes}
                    onChange={handleChange}
                    rows="3"
                  />
                </div>

                {form.productId && (
                  <div className="sale-summary full-width">
                    <div>
                      <span>Quantity</span>
                      <strong>{quantity}</strong>
                    </div>

                    <div>
                      <span>Price / Item</span>
                      <strong>
                        ₹
                        {purchasePrice.toLocaleString(
                          "en-IN"
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>Total Purchase</span>
                      <strong>
                        ₹
                        {totalAmount.toLocaleString(
                          "en-IN"
                        )}
                      </strong>
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => {
                    resetForm();
                    setShowForm(false);
                  }}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-btn"
                  disabled={saving}
                >
                  <Package size={18} />

                  {saving
                    ? "Recording..."
                    : "Record Purchase"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Purchases;