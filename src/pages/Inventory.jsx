import { useEffect, useState } from "react";
import {
  Plus,
  Search,
  Package,
  AlertTriangle,
  Edit,
  Trash2,
  X,
} from "lucide-react";

const API_URL =  import.meta.env.VITE_API_URL;

function Inventory() {
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    name: "",
    category: "",
    purchasePrice: "",
    sellingPrice: "",
    stock: "",
    minStock: "",
  });

  const categories = [
    "Saree",
    "Kurti",
    "Suit",
    "Dress",
    "Tops",
    "Palazzo",
    "Party Wear",
    "Wedding Collection",
    "Accessories",
  ];

  // Load products from MySQL
  const fetchProducts = async () => {
    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/api/products`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to fetch products");
      }

      setProducts(data.products);
    } catch (error) {
      console.error("Fetch products error:", error);
      alert("Unable to load products from the server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const resetForm = () => {
    setForm({
      name: "",
      category: "",
      purchasePrice: "",
      sellingPrice: "",
      stock: "",
      minStock: "",
    });

    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !form.name ||
      !form.category ||
      form.purchasePrice === "" ||
      form.sellingPrice === "" ||
      form.stock === "" ||
      form.minStock === ""
    ) {
      alert("Please fill all product details.");
      return;
    }

    try {
      setSaving(true);

      const productData = {
        product_name: form.name,
        category: form.category,
        purchase_price: Number(form.purchasePrice),
        selling_price: Number(form.sellingPrice),
        current_stock: Number(form.stock),
        minimum_stock: Number(form.minStock),
      };

      const url = editingId
  ?       `${API_URL}/api/products/${editingId}`
  :       `${API_URL}/api/products`;

      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(productData),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to save product");
      }

      await fetchProducts();

      resetForm();
      setShowForm(false);

      alert(
        editingId
          ? "Product updated successfully."
          : "Product added successfully."
      );
    } catch (error) {
      console.error("Save product error:", error);
      alert(error.message || "Unable to save product.");
    } finally {
      setSaving(false);
    }
  };

  const editProduct = (product) => {
    setEditingId(product.id);

    setForm({
      name: product.product_name,
      category: product.category,
      purchasePrice: product.purchase_price,
      sellingPrice: product.selling_price,
      stock: product.current_stock,
      minStock: product.minimum_stock,
    });

    setShowForm(true);
  };

  const deleteProduct = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this product?"
    );

    if (!confirmed) {
      return;
    }

    try {
     const response = await fetch(`${API_URL}/api/products/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to delete product");
      }

      await fetchProducts();

      alert("Product deleted successfully.");
    } catch (error) {
      console.error("Delete product error:", error);
      alert(error.message || "Unable to delete product.");
    }
  };

  const filteredProducts = products.filter((product) =>
    `${product.product_name} ${product.category}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const totalProducts = products.length;

  const totalStock = products.reduce(
    (total, product) => total + Number(product.current_stock),
    0
  );

  const lowStock = products.filter(
    (product) =>
      Number(product.current_stock) > 0 &&
      Number(product.current_stock) <= Number(product.minimum_stock)
  ).length;

  const outOfStock = products.filter(
    (product) => Number(product.current_stock) === 0
  ).length;

  const inventoryValue = products.reduce(
    (total, product) =>
      total +
      Number(product.purchase_price) *
        Number(product.current_stock),
    0
  );

  return (
    <div className="page">

      {/* Header */}
      <div className="page-header">
        <div>
          <h1>Inventory</h1>
          <p>Manage products, stock and pricing</p>
        </div>

        <button
          className="primary-btn"
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
        >
          <Plus size={18} />
          Add Product
        </button>
      </div>

      {/* Summary Cards */}
      <div className="stats-grid inventory-stats">

        <div className="stat-card">
          <div className="stat-top">
            <div>
              <p className="stat-title">Total Products</p>
              <h2>{totalProducts}</h2>
              <p className="stat-subtitle">
                Products in inventory
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
              <p className="stat-title">Total Stock</p>
              <h2>{totalStock}</h2>
              <p className="stat-subtitle">
                Items available
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
              <p className="stat-title">Low Stock</p>
              <h2>{lowStock}</h2>
              <p className="stat-subtitle">
                Products need attention
              </p>
            </div>

            <div className="stat-icon warning-icon">
              <AlertTriangle size={24} />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <div>
              <p className="stat-title">Inventory Value</p>
              <h2>
                ₹{inventoryValue.toLocaleString("en-IN")}
              </h2>
              <p className="stat-subtitle">
                Purchase cost of stock
              </p>
            </div>

            <div className="stat-icon">
              ₹
            </div>
          </div>
        </div>

      </div>

      {/* Inventory Table */}
      <div className="table-card">

        <div className="table-header">
          <div>
            <h2>Products</h2>
            <p>Current inventory and pricing</p>
          </div>

          <div className="search-box">
            <Search size={18} />

            <input
              type="text"
              placeholder="Search product or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="table-wrapper">

          {loading ? (
            <div className="empty-state">
              <Package size={40} />
              <h3>Loading products...</h3>
              <p>Please wait.</p>
            </div>
          ) : (
            <table className="data-table">

              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Purchase Price</th>
                  <th>Selling Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>

                {filteredProducts.map((product) => {

                  let status = "In Stock";
                  let statusClass = "stock-good";

                  if (Number(product.current_stock) === 0) {
                    status = "Out of Stock";
                    statusClass = "stock-out";
                  } else if (
                    Number(product.current_stock) <=
                    Number(product.minimum_stock)
                  ) {
                    status = "Low Stock";
                    statusClass = "stock-low";
                  }

                  return (
                    <tr key={product.id}>

                      <td>
                        <strong>
                          {product.product_name}
                        </strong>
                      </td>

                      <td>{product.category}</td>

                      <td>
                        ₹
                        {Number(
                          product.purchase_price
                        ).toLocaleString("en-IN")}
                      </td>

                      <td>
                        ₹
                        {Number(
                          product.selling_price
                        ).toLocaleString("en-IN")}
                      </td>

                      <td>
                        <strong>
                          {product.current_stock}
                        </strong>
                      </td>

                      <td>
                        <span
                          className={`stock-badge ${statusClass}`}
                        >
                          {status}
                        </span>
                      </td>

                      <td>
                        <div className="table-actions">

                          <button
                            className="icon-btn"
                            title="Edit"
                            onClick={() =>
                              editProduct(product)
                            }
                          >
                            <Edit size={17} />
                          </button>

                          <button
                            className="icon-btn delete-btn"
                            title="Delete"
                            onClick={() =>
                              deleteProduct(product.id)
                            }
                          >
                            <Trash2 size={17} />
                          </button>

                        </div>
                      </td>

                    </tr>
                  );
                })}

              </tbody>

            </table>
          )}

          {!loading && filteredProducts.length === 0 && (
            <div className="empty-state">
              <Package size={40} />
              <h3>No products found</h3>
              <p>
                Add a product or change your search.
              </p>
            </div>
          )}

        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {showForm && (
        <div className="modal-overlay">

          <div className="modal">

            <div className="modal-header">
              <div>
                <h2>
                  {editingId
                    ? "Edit Product"
                    : "Add Product"}
                </h2>

                <p>
                  {editingId
                    ? "Update product information"
                    : "Add a product to your inventory"}
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

            <form onSubmit={handleSubmit}>

              <div className="form-grid">

                <div className="form-group full-width">
                  <label>Product Name</label>

                  <input
                    type="text"
                    name="name"
                    placeholder="e.g. Designer Kurti"
                    value={form.name}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label>Category</label>

                  <select
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                  >
                    <option value="">
                      Select Category
                    </option>

                    {categories.map((category) => (
                      <option
                        key={category}
                        value={category}
                      >
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Opening Stock</label>

                  <input
                    type="number"
                    name="stock"
                    min="0"
                    placeholder="e.g. 20"
                    value={form.stock}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label>Purchase Price</label>

                  <input
                    type="number"
                    name="purchasePrice"
                    min="0"
                    step="0.01"
                    placeholder="₹ Cost per item"
                    value={form.purchasePrice}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label>Selling Price</label>

                  <input
                    type="number"
                    name="sellingPrice"
                    min="0"
                    step="0.01"
                    placeholder="₹ Selling price"
                    value={form.sellingPrice}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label>Minimum Stock Level</label>

                  <input
                    type="number"
                    name="minStock"
                    min="0"
                    placeholder="e.g. 5"
                    value={form.minStock}
                    onChange={handleChange}
                  />
                </div>

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
                  <Plus size={18} />

                  {saving
                    ? "Saving..."
                    : editingId
                    ? "Update Product"
                    : "Add Product"}
                </button>

              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}

export default Inventory;