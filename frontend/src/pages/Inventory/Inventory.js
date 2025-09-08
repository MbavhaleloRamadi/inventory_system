import React, { useState, useEffect, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Eye,
  Edit,
  Trash2,
  Package,
  MoreVertical,
  RefreshCw,
  CheckSquare,
  Square,
  ChevronDown,
  ChevronUp,
  MapPin,
} from "lucide-react";
import { inventoryAPI } from "../../services/api";
import toast from "react-hot-toast";

const Inventory = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [filters, setFilters] = useState({
    search: searchParams.get("search") || "",
    category: searchParams.get("category") || "",
    location: searchParams.get("location") || "",
    status: searchParams.get("status") || "",
    lowStock: searchParams.get("lowStock") === "true",
  });
  const [pagination, setPagination] = useState({
    page: parseInt(searchParams.get("page")) || 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState(searchParams.get("sortBy") || "name");
  const [sortOrder, setSortOrder] = useState(
    searchParams.get("sortOrder") || "asc"
  );

  // Dynamic categories and locations - will be populated from API
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  // Fetch filter options
  const fetchFilterOptions = useCallback(async () => {
    try {
      const [catRes, locRes, supRes] = await Promise.all([
        inventoryAPI.getCategories().catch(() => ({ data: { results: [] } })),
        inventoryAPI.getLocations().catch(() => ({ data: { results: [] } })),
        inventoryAPI.getSuppliers().catch(() => ({ data: { results: [] } })),
      ]);

      setCategories(catRes.data.results || catRes.data || []);
      setLocations(locRes.data.results || locRes.data || []);
      setSuppliers(supRes.data.results || supRes.data || []);
    } catch (error) {
      console.warn("Failed to fetch filter options, using defaults:", error);
      // Fallback to hardcoded options
      setCategories(["Electronics", "Tools", "Materials", "Safety", "Office"]);
      setLocations([
        "Warehouse A",
        "Warehouse B",
        "Office",
        "Site 1",
        "Site 2",
      ]);
      setSuppliers(["Global Tools Inc.", "SafeTech Supply", "Office Plus"]);
    }
  }, []);

  const fetchItems = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const params = {
          page: pagination.page,
          page_size: pagination.pageSize,
          search: filters.search || undefined,
          category: filters.category || undefined,
          location: filters.location || undefined,
          status: filters.status || undefined,
          low_stock: filters.lowStock || undefined,
          ordering: `${sortOrder === "desc" ? "-" : ""}${sortBy}`,
        };

        // Remove undefined values
        Object.keys(params).forEach(
          (key) => params[key] === undefined && delete params[key]
        );

        // Update URL with current state
        const newSearchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== "") {
            newSearchParams.set(key, value.toString());
          }
        });
        newSearchParams.set("sortBy", sortBy);
        newSearchParams.set("sortOrder", sortOrder);
        setSearchParams(newSearchParams);

        // In the fetchItems function, replace the response handling with:
        const response = await inventoryAPI.getItems(params);

        // Add debugging
        console.log("API Response:", response);

        // Extract items more safely
        let fetchedItems = [];
        if (response.data) {
          if (Array.isArray(response.data.results)) {
            fetchedItems = response.data.results;
          } else if (Array.isArray(response.data)) {
            fetchedItems = response.data;
          }
        }

        console.log("Fetched items:", fetchedItems);

        const totalCount = response.data?.count || fetchedItems.length;
        setItems(fetchedItems);

        setItems(fetchedItems);
        setPagination((prev) => ({
          ...prev,
          total: totalCount,
          totalPages: Math.ceil(totalCount / prev.pageSize),
        }));

        if (isRefresh) {
          toast.success("Inventory data refreshed successfully");
        }
      } catch (error) {
        console.error("Failed to fetch inventory items:", error);

        if (isRefresh) {
          toast.error("Failed to refresh inventory data");
        } else {
          toast.error("Failed to load inventory items");
        }

        // Mock data for development when API fails
        const mockItems = [
          {
            id: 1,
            name: "Safety Helmet",
            sku: "SH-001",
            category: "Safety",
            location: "Warehouse A",
            current_stock: 45,
            reorder_level: 20,
            unit_price: 25.99,
            total_value: 1169.55,
            last_updated: "2024-06-12T10:30:00Z",
          },
          {
            id: 2,
            name: "Power Drill",
            sku: "PD-002",
            category: "Tools",
            location: "Warehouse B",
            current_stock: 8,
            reorder_level: 15,
            unit_price: 89.99,
            total_value: 719.92,
            last_updated: "2024-06-11T14:20:00Z",
          },
          {
            id: 3,
            name: "Steel Pipe",
            sku: "SP-003",
            category: "Materials",
            location: "Site 1",
            current_stock: 0,
            reorder_level: 50,
            unit_price: 12.5,
            total_value: 0,
            last_updated: "2024-06-10T09:15:00Z",
          },
        ];

        setItems(mockItems);
        setPagination((prev) => ({
          ...prev,
          total: mockItems.length,
          totalPages: Math.ceil(mockItems.length / prev.pageSize),
        }));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [
      filters,
      pagination.page,
      pagination.pageSize,
      sortBy,
      sortOrder,
      setSearchParams,
    ]
  );

  // Initial data fetch
  useEffect(() => {
    fetchFilterOptions();
  }, [fetchFilterOptions]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleRefresh = useCallback(() => {
    // Clear selections when refreshing
    setSelectedItems([]);
    fetchItems(true);
  }, [fetchItems]);

  const handleSearch = (e) => {
    const value = e.target.value;
    setFilters((prev) => ({ ...prev, search: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const handleSelectItem = (itemId) => {
    setSelectedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSelectAll = () => {
    if (selectedItems.length === items.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(items.map((item) => item.id));
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedItems.length === 0) {
      toast.error("Please select items first");
      return;
    }

    try {
      switch (action) {
        case "export":
          // In a real implementation, this would generate and download a file
          toast.success(`Exporting ${selectedItems.length} items...`);
          break;
        case "delete":
          if (
            window.confirm(
              `Are you sure you want to delete ${selectedItems.length} items?`
            )
          ) {
            // In a real implementation, this would make API calls to delete items
            await Promise.all(
              selectedItems.map((id) =>
                inventoryAPI.deleteItem(id).catch((err) => {
                  console.warn(`Failed to delete item ${id}:`, err);
                  return null;
                })
              )
            );
            toast.success("Items deleted successfully");
            setSelectedItems([]);
            handleRefresh();
          }
          break;
        case "update_location":
          toast.info("Location update modal coming soon");
          break;
        default:
          break;
      }
    } catch (error) {
      console.error("Bulk action failed:", error);
      toast.error("Bulk action failed");
    }
  };

  const getStockStatus = (item) => {
    if (item.current_stock <= 0)
      return { status: "Out of Stock", color: "text-red-600 bg-red-50" };
    if (item.current_stock <= item.reorder_level)
      return { status: "Low Stock", color: "text-yellow-600 bg-yellow-50" };
    return { status: "In Stock", color: "text-green-600 bg-green-50" };
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount || 0);
  };

  const getSortIcon = (column) => {
    if (sortBy !== column) return null;
    return sortOrder === "asc" ? (
      <ChevronUp className="h-4 w-4" />
    ) : (
      <ChevronDown className="h-4 w-4" />
    );
  };

  if (loading && items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Inventory Management
            </h1>
            <p className="text-gray-600">
              Manage your inventory items and stock levels
              {items.length > 0 && ` (${pagination.total} total items)`}
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleRefresh}
              disabled={loading || refreshing}
              className="btn-secondary"
              title="Refresh inventory data"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
              />
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
            <button
              onClick={() => handleBulkAction("export")}
              className="btn-secondary"
              disabled={loading}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
            <button className="btn-secondary" disabled={loading}>
              <Upload className="h-4 w-4 mr-2" />
              Import
            </button>
            <Link to="/inventory/new" className="btn-primary">
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Link>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search items..."
                value={filters.search}
                onChange={handleSearch}
                className="form-input pl-10"
              />
            </div>
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn-secondary"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange("category", e.target.value)}
                className="form-select"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option
                    key={category.id || category}
                    value={category.id || category}
                  >
                    {category.name || category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <select
                value={filters.location}
                onChange={(e) => handleFilterChange("location", e.target.value)}
                className="form-select"
              >
                <option value="">All Locations</option>
                {locations.map((location) => (
                  <option
                    key={location.id || location}
                    value={location.id || location}
                  >
                    {location.name || location}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stock Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className="form-select"
              >
                <option value="">All Status</option>
                <option value="in-stock">In Stock</option>
                <option value="low-stock">Low Stock</option>
                <option value="out-of-stock">Out of Stock</option>
              </select>
            </div>

            <div className="flex items-end">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.lowStock}
                  onChange={(e) =>
                    handleFilterChange("lowStock", e.target.checked)
                  }
                  className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Low Stock Only
                </span>
              </label>
            </div>
          </div>
        )}
      </div>

      {selectedItems.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-sm font-medium text-blue-900">
                {selectedItems.length} item{selectedItems.length > 1 ? "s" : ""}{" "}
                selected
              </span>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handleBulkAction("export")}
                className="inline-flex items-center px-3 py-1.5 border border-blue-300 text-xs font-medium rounded text-blue-700 bg-white hover:bg-blue-50"
              >
                <Download className="h-3 w-3 mr-1" />
                Export
              </button>
              <button
                onClick={() => handleBulkAction("update_location")}
                className="inline-flex items-center px-3 py-1.5 border border-blue-300 text-xs font-medium rounded text-blue-700 bg-white hover:bg-blue-50"
              >
                <MapPin className="h-3 w-3 mr-1" />
                Update Location
              </button>
              <button
                onClick={() => handleBulkAction("delete")}
                className="inline-flex items-center px-3 py-1.5 border border-red-300 text-xs font-medium rounded text-red-700 bg-white hover:bg-red-50"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th className="px-6 py-3 text-left">
                  <button
                    onClick={handleSelectAll}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    {selectedItems.length === items.length &&
                    items.length > 0 ? (
                      <CheckSquare className="h-5 w-5" />
                    ) : (
                      <Square className="h-5 w-5" />
                    )}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort("name")}
                    className="flex items-center space-x-1 hover:text-gray-700"
                  >
                    <span>Item</span>
                    {getSortIcon("name")}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort("category")}
                    className="flex items-center space-x-1 hover:text-gray-700"
                  >
                    <span>Category</span>
                    {getSortIcon("category")}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort("location")}
                    className="flex items-center space-x-1 hover:text-gray-700"
                  >
                    <span>Location</span>
                    {getSortIcon("location")}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort("current_stock")}
                    className="flex items-center space-x-1 hover:text-gray-700"
                  >
                    <span>Stock</span>
                    {getSortIcon("current_stock")}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort("unit_price")}
                    className="flex items-center space-x-1 hover:text-gray-700"
                  >
                    <span>Unit Price</span>
                    {getSortIcon("unit_price")}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {items.map((item) => {
                const stockStatus = getStockStatus(item);
                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleSelectItem(item.id)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        {selectedItems.includes(item.id) ? (
                          <CheckSquare className="h-5 w-5 text-red-600" />
                        ) : (
                          <Square className="h-5 w-5" />
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-lg bg-gray-200 flex items-center justify-center">
                            <Package className="h-6 w-6 text-gray-500" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {item.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            SKU: {item.sku}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.location}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.current_stock} / {item.reorder_level}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${stockStatus.color}`}
                      >
                        {stockStatus.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(item.unit_price)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(item.total_value)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <Link
                          to={`/inventory/${item.id}`}
                          className="text-red-600 hover:text-red-900"
                          title="View details"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <Link
                          to={`/inventory/${item.id}/edit`}
                          className="text-gray-600 hover:text-gray-900"
                          title="Edit item"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <button
                          className="text-gray-400 hover:text-gray-600"
                          title="More options"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing{" "}
                  <span className="font-medium">
                    {(pagination.page - 1) * pagination.pageSize + 1}
                  </span>{" "}
                  to{" "}
                  <span className="font-medium">
                    {Math.min(
                      pagination.page * pagination.pageSize,
                      pagination.total
                    )}
                  </span>{" "}
                  of <span className="font-medium">{pagination.total}</span>{" "}
                  results
                </p>
              </div>
              <div>
                <nav
                  className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                  aria-label="Pagination"
                >
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  {[...Array(pagination.totalPages)].map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => handlePageChange(i + 1)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        pagination.page === i + 1
                          ? "z-10 bg-red-50 border-red-500 text-red-600"
                          : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Empty State */}
      {!loading && items.length === 0 && (
        <div className="text-center py-12">
          <Package className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No inventory items
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by adding your first inventory item.
          </p>
          <div className="mt-6">
            <Link to="/inventory/new" className="btn-primary">
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
