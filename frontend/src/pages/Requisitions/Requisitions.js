import React from 'react';
import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

const Requisitions = () => {
    const requisitions = [
        { id: 'REQ-001', requestedBy: 'John Doe', status: 'Approved', items: 3, date: '2025-06-11' },
        { id: 'REQ-002', requestedBy: 'Jane Smith', status: 'Pending', items: 5, date: '2025-06-12' },
        { id: 'REQ-003', requestedBy: 'John Doe', status: 'Dispatched', items: 2, date: '2025-06-09' },
    ];

    const getStatusClass = (status) => {
        switch (status.toLowerCase()) {
            case 'approved': return 'bg-blue-100 text-blue-800';
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'dispatched': return 'bg-green-100 text-green-800';
            case 'rejected': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Requisitions</h1>
          <p className="text-gray-600">Request items from inventory.</p>
        </div>
        <Link to="/requisitions/new" className="btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          New Requisition
        </Link>
      </div>

       <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requisition ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requested By</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {requisitions.map((req) => (
                <tr key={req.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                     <Link to={`/requisitions/${req.id}`}>{req.id}</Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{req.requestedBy}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{req.date}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{req.items}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(req.status)}`}>
                      {req.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link to={`/requisitions/${req.id}`} className="text-red-600 hover:text-red-900">
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

export default Requisitions;
