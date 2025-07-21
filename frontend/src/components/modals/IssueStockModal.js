import React, { useState } from 'react';
import { X, Minus } from 'lucide-react';
import { inventoryAPI } from '../../services/api';
import toast from 'react-hot-toast';

const IssueStockModal = ({ isOpen, onClose, onStockIssued }) => {
  const [sku, setSku] = useState('');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!sku || !quantity || quantity <= 0 || !reason) {
      toast.error('Please fill in all fields.');
      return;
    }
    setLoading(true);
    try {
      await inventoryAPI.issueStock({ sku, quantity: parseInt(quantity), reason });
      toast.success('Stock issued successfully!');
      onStockIssued(); // This will trigger a refresh on the dashboard
      onClose();
    } catch (error) {
      console.error('Failed to issue stock:', error);
      toast.error(error.response?.data?.error || 'Failed to issue stock.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Issue Items</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="sku" className="block text-sm font-medium text-gray-700">Item SKU</label>
            <input
              type="text"
              id="sku"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              className="form-input mt-1"
              placeholder="Enter item SKU"
              required
            />
          </div>
          <div>
            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">Quantity to Issue</label>
            <input
              type="number"
              id="quantity"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="form-input mt-1"
              placeholder="e.g., 10"
              min="1"
              required
            />
          </div>
          <div>
            <label htmlFor="reason" className="block text-sm font-medium text-gray-700">Reason for Issuing</label>
            <input
              type="text"
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="form-input mt-1"
              placeholder="e.g., Project ABC"
              required
            />
          </div>
          <div className="flex justify-end">
            <button type="submit" className="btn-danger" disabled={loading}>
              <Minus className="h-4 w-4 mr-2" />
              {loading ? 'Issuing...' : 'Issue Items'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default IssueStockModal;