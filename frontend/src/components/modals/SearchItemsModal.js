import React, { useState } from "react";
import { X, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

const SearchItemsModal = ({ isOpen, onClose }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/inventory?search=${encodeURIComponent(searchTerm.trim())}`);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Search Inventory</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <form onSubmit={handleSearch} className="flex items-center space-x-2">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input flex-1"
            placeholder="Enter item name or SKU..."
            autoFocus
          />
          <button type="submit" className="btn-primary">
            <Search className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default SearchItemsModal;
