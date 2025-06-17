import React from 'react';
import { Plus, ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';

const PurchaseOrders = () => {
    // Mock data for now
    const purchaseOrders = [
        { id: 'PO-2025-001', supplier: 'Global Tools Inc.', status: 'Approved', total: 1500.00, date: '2025-06-10' },
        { id: 'PO-2025-002', supplier: 'Bulk Materials Co.', status: 'Pending', total: 3250.50, date: '2025-06-11' },
        { id: 'PO-2025-003', supplier: 'Safety Gear Online', status: 'Received', total: 800.75, date: '2025-06-08' },
    ];

    const getStatusClass = (status) => {
        switch (status.toLowerCase()) {
            case 'approved': return 'bg-blue-100 text-blue-800';
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'received': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };
    
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
    <ShoppingCart className="h-8 w-8 text-gray-400 mr-3" />
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Purchase Orders</h1>
      <p className="text-gray-600">Manage all your purchase orders.</p>
    </div>
  </div>
        <Link to="/purchase-orders/new" className="btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          New Purchase Order
        </Link>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {purchaseOrders.map((po) => (
                <tr key={po.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                    <Link to={`/purchase-orders/${po.id}`}>{po.id}</Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{po.supplier}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{po.date}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${po.total.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(po.status)}`}>
                      {po.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link to={`/purchase-orders/${po.id}`} className="text-red-600 hover:text-red-900">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PurchaseOrders;
