import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { inventoryAPI } from "../../services/api";
import toast from "react-hot-toast";
import { ArrowLeft, Save } from "lucide-react";

const AddItem = () => {
  const navigate = useNavigate();
  const [item, setItem] = useState({
    name: "",
    sku: "",
    description: "",
    category: "",
    location: "",
    supplier: "",
    quantity: 0,
    reorder_level: 10,
    unit_price: 0.0,
  });
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch related data like categories, locations, and suppliers for dropdowns
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, locRes, supRes] = await Promise.all([
          inventoryAPI.getCategories(),
          inventoryAPI.getLocations(),
          inventoryAPI.getSuppliers(),
        ]);
        setCategories(catRes.data.results || []);
        setLocations(locRes.data.results || []);
        setSuppliers(supRes.data.results || []);
      } catch (error) {
        toast.error("Failed to load necessary data for the form.");
        console.error("Data fetch error:", error);
      }
    };
    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setItem((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Ensure numeric fields are sent as numbers
      const dataToSubmit = {
        ...item,
        quantity: parseInt(item.quantity, 10),
        reorder_level: parseInt(item.reorder_level, 10),
        unit_price: parseFloat(item.unit_price),
        // Send IDs for foreign keys, if they are not empty
        category: item.category || null,
        location: item.location || null,
        supplier: item.supplier || null,
      };
      await inventoryAPI.createItem(dataToSubmit);
      toast.success("Item added successfully!");
      navigate("/inventory?refresh=" + Date.now());
    } catch (error) {
      console.error("Failed to add item:", error.response?.data);
      toast.error(
        Object.values(error.response?.data).join(", ") || "Failed to add item."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          to="/inventory"
          className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Inventory
        </Link>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="bg-white shadow rounded-lg p-6 space-y-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Add New Inventory Item
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Form Fields */}
            <div>
              <label className="form-label">Item Name</label>
              <input
                name="name"
                value={item.name}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>
            <div>
              <label className="form-label">SKU</label>
              <input
                name="sku"
                value={item.sku}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="form-label">Description</label>
              <textarea
                name="description"
                value={item.description}
                onChange={handleChange}
                className="form-textarea"
              />
            </div>
            <div>
              <label className="form-label">Category</label>
              <select
                name="category"
                value={item.category}
                onChange={handleChange}
                className="form-select"
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Location</label>
              <select
                name="location"
                value={item.location}
                onChange={handleChange}
                className="form-select"
              >
                <option value="">Select Location</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Supplier</label>
              <select
                name="supplier"
                value={item.supplier}
                onChange={handleChange}
                className="form-select"
              >
                <option value="">Select Supplier</option>
                {suppliers.map((sup) => (
                  <option key={sup.id} value={sup.id}>
                    {sup.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Initial Quantity</label>
              <input
                name="quantity"
                type="number"
                value={item.quantity}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>
            <div>
              <label className="form-label">Reorder Level</label>
              <input
                name="reorder_level"
                type="number"
                value={item.reorder_level}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>
            <div>
              <label className="form-label">Unit Price</label>
              <input
                name="unit_price"
                type="number"
                step="0.01"
                value={item.unit_price}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button type="submit" className="btn-primary" disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? "Saving..." : "Save Item"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AddItem;
