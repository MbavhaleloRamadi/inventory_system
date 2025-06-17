import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { inventoryAPI } from '../../services/api'; // Corrected path
import toast from 'react-hot-toast';
import { ArrowLeft, Edit, Trash2, Package } from 'lucide-react';

const InventoryDetail = () => {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItem = async () => {
      try {
        try {
  const response = await inventoryAPI.getItem(id);
  setItem(response.data);
} catch (apiError) {
  console.warn('API call failed, using mock data:', apiError);
}

  // Mock data for development
        setItem({
            id: id,
            name: 'Heavy Duty Power Drill',
            sku: 'PD-HD-002',
            category: 'Power Tools',
            description: 'A robust and powerful drill for heavy-duty applications, featuring variable speed control and a durable chuck.',
            location: 'Warehouse A, Shelf 3-B',
            current_stock: 12,
            reorder_level: 10,
            unit_price: 129.99,
            supplier: 'Global Tools Inc.',
            last_updated: '2025-06-10T08:45:00Z',
            movements: [
                { id: 1, type: 'in', quantity: 20, date: '2025-06-01', user: 'John Doe', reason: 'Initial Stock' },
                { id: 2, type: 'out', quantity: 5, date: '2025-06-05', user: 'Jane Smith', reason: 'Project Build-out' },
                { id: 3, type: 'out', quantity: 3, date: '2025-06-08', user: 'Jane Smith', reason: 'Project Build-out' },
            ]
        });
      } catch (error) {
        toast.error('Failed to fetch item details.');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [id]);

  if (loading) {
    return <div className="text-center p-8">Loading item details...</div>;
  }

  if (!item) {
    return <div className="text-center p-8">Item not found.</div>;
  }
    
  const totalValue = item.current_stock * item.unit_price;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link to="/inventory" className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Inventory
        </Link>
        <div className="flex space-x-3">
          <button className="btn-secondary">
            <Edit className="h-4 w-4 mr-2" /> Edit
          </button>
          <button className="btn-danger">
            <Trash2 className="h-4 w-4 mr-2" /> Delete
          </button>
        </div>
      </div>

      {/* Item Details Card */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:px-6">
  <div className="flex items-center">
    <Package className="h-8 w-8 text-gray-400 mr-3" />
    <div>
      <h2 className="text-2xl font-bold text-gray-900">{item.name}</h2>
      <p className="mt-1 max-w-2xl text-sm text-gray-500">SKU: {item.sku}</p>
    </div>
  </div>
</div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
          <dl className="sm:divide-y sm:divide-gray-200">
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Description</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{item.description}</dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Category</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{item.category}</dd>
            </div>
             <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Location</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{item.location}</dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Current Stock</dt>
              <dd className="mt-1 text-sm font-bold text-gray-900 sm:mt-0 sm:col-span-2">{item.current_stock}</dd>
            </div>
             <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Reorder Level</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{item.reorder_level}</dd>
            </div>
             <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Unit Price</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">${item.unit_price.toFixed(2)}</dd>
            </div>
             <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Total Value</dt>
              <dd className="mt-1 text-sm font-bold text-green-600 sm:mt-0 sm:col-span-2">${totalValue.toFixed(2)}</dd>
            </div>
             <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Supplier</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{item.supplier}</dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{new Date(item.last_updated).toLocaleString()}</dd>
            </div>
          </dl>
        </div>
      </div>
      
       {/* Stock Movement History */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Stock Movement History</h3>
        </div>
        <div className="border-t border-gray-200">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {item.movements.map((move) => (
                            <tr key={move.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(move.date).toLocaleDateString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${move.type === 'in' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {move.type}
                                    </span>
                                </td>
                                <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${move.type === 'in' ? 'text-green-600' : 'text-red-600'}`}>
                                    {move.type === 'in' ? '+' : '-'}{move.quantity}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{move.reason}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{move.user}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryDetail;
