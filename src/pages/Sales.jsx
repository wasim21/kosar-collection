import { useEffect, useState } from "react";
import {
  Plus,
  Search,
  ShoppingCart,
  IndianRupee,
  TrendingUp,
  X,
  Trash2,
} from "lucide-react";

import { apiFetch } from "../utils/api";

// Get today's date according to Indian Standard Time (IST)
const getISTDate = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
  }).format(new Date());

function Sales() {
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);

  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    productId: "",
    quantity: 1,
    paymentMethod: "Cash",
    saleDate: getISTDate(),
  });

  const fetchSales = async () => {
    try {
      const data = await apiFetch("/api/sales");

      if (!data.success) {
        throw new Error(
          data.message || "Failed to fetch sales"
        );
      }

      setSales(data.sales);
    } catch (error) {
      console.error("Fetch sales error:", error);

      alert(
        error.message ||
          "Unable to load sales."
      );
    }
  };

  const fetchProducts = async () => {
    try {
      const data = await apiFetch(
        "/api/sales/products"
      );

      if (!data.success) {
        throw new Error(
          data.message || "Failed to fetch products"
        );
      }

      setProducts(data.products);
    } catch (error) {
      console.error(
        "Fetch products error:",
        error
      );

      alert(
        error.message ||
          "Unable to load products."
      );
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);

      await Promise.all([
        fetchSales(),
        fetchProducts(),
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const selectedProduct = products.find(
    (product) =>
      String(product.id) ===
      String(form.productId)
  );

  const quantity =
    Number(form.quantity) || 0;

  const totalAmount = selectedProduct
    ? Number(
        selectedProduct.selling_price
      ) * quantity
    : 0;

  const totalCost = selectedProduct
    ? Number(
        selectedProduct.purchase_price
      ) * quantity
    : 0;

  const grossProfit =
    totalAmount - totalCost;

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const resetForm = () => {
    setForm({
      productId: "",
      quantity: 1,
      paymentMethod: "Cash",
      saleDate: getISTDate(),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.productId) {
      alert("Please select a product.");
      return;
    }

    if (quantity <= 0) {
      alert(
        "Quantity must be greater than 0."
      );
      return;
    }

    if (!selectedProduct) {
      alert(
        "Selected product is not available."
      );
      return;
    }

    if (
      quantity >
      Number(selectedProduct.current_stock)
    ) {
      alert(
        `Only ${selectedProduct.current_stock} item(s) are available in stock.`
      );
      return;
    }

    try {
      setSaving(true);

      const data = await apiFetch(
        "/api/sales",
        {
          method: "POST",
          body: JSON.stringify({
            product_id: Number(
              form.productId
            ),
            quantity,
            payment_method:
              form.paymentMethod,
            sale_date: form.saleDate,
          }),
        }
      );

      if (!data.success) {
        throw new Error(
          data.message ||
            "Failed to record sale"
        );
      }

      alert(
        `Sale recorded successfully!\nGross Profit: ₹${Number(
          data.sale.gross_profit
        ).toLocaleString("en-IN")}`
      );

      resetForm();
      setShowForm(false);

      await loadData();
    } catch (error) {
      console.error(
        "Save sale error:",
        error
      );

      alert(
        error.message ||
          "Unable to record sale."
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteSale = async (id) => {
    const confirmed =
      window.confirm(
        "Delete this sale?\n\nThe sold quantity will be returned to inventory."
      );

    if (!confirmed) {
      return;
    }

    try {
      const data = await apiFetch(
        `/api/sales/${id}`,
        {
          method: "DELETE",
        }
      );

      if (!data.success) {
        throw new Error(
          data.message ||
            "Failed to delete sale"
        );
      }

      alert(
        "Sale deleted and stock restored."
      );

      await loadData();
    } catch (error) {
      console.error(
        "Delete sale error:",
        error
      );

      alert(
        error.message ||
          "Unable to delete sale."
      );
    }
  };

  // Today's date according to IST
  const today = getISTDate();

  const todaySales = sales.filter(
    (sale) =>
      sale.sale_date?.split("T")[0] ===
      today
  );

  const todayRevenue =
    todaySales.reduce(
      (total, sale) =>
        total +
        Number(sale.total_amount),
      0
    );

  const todayProfit =
    todaySales.reduce(
      (total, sale) =>
        total +
        Number(sale.gross_profit),
      0
    );

  const todayItems =
    todaySales.reduce(
      (total, sale) =>
        total +
        Number(sale.quantity),
      0
    );

  const filteredSales =
    sales.filter((sale) =>
      `${sale.product_name} ${sale.category} ${sale.payment_method}`
        .toLowerCase()
        .includes(
          search.toLowerCase()
        )
    );

  return (
    <div className="page">

      <div className="page-header">

        <div>
          <h1>Sales</h1>

          <p>
            Record sales and track your
            profit
          </p>
        </div>

        <button
          className="primary-btn"
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
        >
          <Plus size={18} />
          New Sale
        </button>

      </div>

      <div className="stats-grid">

        <div className="stat-card">

          <div className="stat-top">

            <div>

              <p className="stat-title">
                Today's Sales
              </p>

              <h2>
                ₹
                {todayRevenue.toLocaleString(
                  "en-IN"
                )}
              </h2>

              <p className="stat-subtitle">
                {todaySales.length}{" "}
                transaction(s)
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

              <p className="stat-title">
                Today's Profit
              </p>

              <h2>
                ₹
                {todayProfit.toLocaleString(
                  "en-IN"
                )}
              </h2>

              <p className="stat-subtitle">
                Gross profit
              </p>

            </div>

            <div className="stat-icon">
              <TrendingUp size={24} />
            </div>

          </div>

        </div>

        <div className="stat-card">

          <div className="stat-top">

            <div>

              <p className="stat-title">
                Items Sold
              </p>

              <h2>
                {todayItems}
              </h2>

              <p className="stat-subtitle">
                Items sold today
              </p>

            </div>

            <div className="stat-icon">
              <ShoppingCart size={24} />
            </div>

          </div>

        </div>

      </div>

      <div className="table-card">

        <div className="table-header">

          <div>

            <h2>
              Sales History
            </h2>

            <p>
              All recorded sales
            </p>

          </div>

          <div className="search-box">

            <Search size={18} />

            <input
              type="text"
              placeholder="Search product, category..."
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
            />

          </div>

        </div>

        <div className="table-wrapper">

          {loading ? (
            <div className="empty-state">

              <ShoppingCart size={40} />

              <h3>
                Loading sales...
              </h3>

              <p>
                Please wait.
              </p>

            </div>
          ) : filteredSales.length ===
            0 ? (
            <div className="empty-state">

              <ShoppingCart size={40} />

              <h3>
                No sales found
              </h3>

              <p>
                Click "New Sale" to
                record your first
                sale.
              </p>

            </div>
          ) : (
            <table className="data-table">

              <thead>

                <tr>
                  <th>Date</th>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Qty</th>
                  <th>Selling Price</th>
                  <th>Total</th>
                  <th>Profit</th>
                  <th>Payment</th>
                  <th>Action</th>
                </tr>

              </thead>

              <tbody>

                {filteredSales.map(
                  (sale) => (

                    <tr
                      key={sale.id}
                    >

                      <td>
                        {
                          sale.sale_date?.split(
                            "T"
                          )[0]
                        }
                      </td>

                      <td>
                        <strong>
                          {
                            sale.product_name
                          }
                        </strong>
                      </td>

                      <td>
                        {sale.category}
                      </td>

                      <td>
                        {sale.quantity}
                      </td>

                      <td>
                        ₹
                        {Number(
                          sale.selling_price
                        ).toLocaleString(
                          "en-IN"
                        )}
                      </td>

                      <td>
                        <strong>
                          ₹
                          {Number(
                            sale.total_amount
                          ).toLocaleString(
                            "en-IN"
                          )}
                        </strong>
                      </td>

                      <td>
                        <strong>
                          ₹
                          {Number(
                            sale.gross_profit
                          ).toLocaleString(
                            "en-IN"
                          )}
                        </strong>
                      </td>

                      <td>
                        {
                          sale.payment_method
                        }
                      </td>

                      <td>

                        <button
                          className="icon-btn delete-btn"
                          title="Delete Sale"
                          onClick={() =>
                            deleteSale(
                              sale.id
                            )
                          }
                        >
                          <Trash2
                            size={17}
                          />
                        </button>

                      </td>

                    </tr>

                  )
                )}

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

                <h2>
                  New Sale
                </h2>

                <p>
                  Record a customer
                  purchase
                </p>

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

            <form
              onSubmit={handleSubmit}
            >

              <div className="form-grid">

                <div className="form-group full-width">

                  <label>
                    Product
                  </label>

                  <select
                    name="productId"
                    value={
                      form.productId
                    }
                    onChange={
                      handleChange
                    }
                  >

                    <option value="">
                      Select Product
                    </option>

                    {products.map(
                      (product) => (

                        <option
                          key={product.id}
                          value={
                            product.id
                          }
                        >
                          {
                            product.product_name
                          }{" "}
                          — Stock:{" "}
                          {
                            product.current_stock
                          }
                        </option>

                      )
                    )}

                  </select>

                </div>

                {selectedProduct && (
                  <>

                    <div className="form-group">

                      <label>
                        Category
                      </label>

                      <input
                        type="text"
                        value={
                          selectedProduct.category
                        }
                        readOnly
                      />

                    </div>

                    <div className="form-group">

                      <label>
                        Selling Price
                      </label>

                      <input
                        type="text"
                        value={`₹${Number(
                          selectedProduct.selling_price
                        ).toLocaleString(
                          "en-IN"
                        )}`}
                        readOnly
                      />

                    </div>

                    <div className="form-group">

                      <label>
                        Available Stock
                      </label>

                      <input
                        type="text"
                        value={
                          selectedProduct.current_stock
                        }
                        readOnly
                      />

                    </div>

                  </>
                )}

                <div className="form-group">

                  <label>
                    Quantity
                  </label>

                  <input
                    type="number"
                    name="quantity"
                    min="1"
                    max={
                      selectedProduct?.current_stock ||
                      undefined
                    }
                    value={
                      form.quantity
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>

                <div className="form-group">

                  <label>
                    Payment Method
                  </label>

                  <select
                    name="paymentMethod"
                    value={
                      form.paymentMethod
                    }
                    onChange={
                      handleChange
                    }
                  >

                    <option value="Cash">
                      Cash
                    </option>

                    <option value="UPI">
                      UPI
                    </option>

                    <option value="Card">
                      Card
                    </option>

                  </select>

                </div>

                <div className="form-group">

                  <label>
                    Sale Date
                  </label>

                  <input
                    type="date"
                    name="saleDate"
                    value={
                      form.saleDate
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>

                {selectedProduct && (

                  <div className="sale-summary full-width">

                    <div>

                      <span>
                        Total Sale
                      </span>

                      <strong>
                        ₹
                        {totalAmount.toLocaleString(
                          "en-IN"
                        )}
                      </strong>

                    </div>

                    <div>

                      <span>
                        Cost
                      </span>

                      <strong>
                        ₹
                        {totalCost.toLocaleString(
                          "en-IN"
                        )}
                      </strong>

                    </div>

                    <div>

                      <span>
                        Gross Profit
                      </span>

                      <strong>
                        ₹
                        {grossProfit.toLocaleString(
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
                  disabled={
                    saving ||
                    products.length === 0
                  }
                >

                  <ShoppingCart
                    size={18}
                  />

                  {saving
                    ? "Recording..."
                    : "Record Sale"}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}

export default Sales;
