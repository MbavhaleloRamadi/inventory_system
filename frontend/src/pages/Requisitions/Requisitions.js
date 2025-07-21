import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Eye, Edit, Trash2 } from 'lucide-react';
import { requisitionsAPI } from '../../services/api'; // Make sure this API service exists
import toast from 'react-hot-toast';

const Requisitions = () => {
  const [requisitions, setRequisitions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRequisitions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await requisitionsAPI.getAll(); // Ensure this method exists and fetches from /api/requisitions/
      
      // --- FIX ---
      // Correctly access the .results array and provide a fallback.
      setRequisitions(response.data.results || []);

    } catch (error) {
      console.error('Failed to fetch requisitions:', error);
      toast.error('Failed to load requisitions.');
      setRequisitions([]); // On error, ensure it's an empty array
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequisitions();
  }, [fetchRequisitions]);

  if (loading) {
    return <div className="text-center p-8">Loading requisitions...</div>;
  }
  
  const getStatusChip = (status) => {
    const statusStyles = {
        pending: 'bg-yellow-100 text-yellow-800',
        approved: 'bg-blue-100 text-blue-800',
        dispatched: 'bg-indigo-100 text-indigo-800',
        completed: 'bg-green-100 text-green-800',
        rejected: 'bg-red-100 text-red-800',
    };
    return (
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusStyles[status] || 'bg-gray-100 text-gray-800'}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Requisitions</h1>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Requested</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Array.isArray(requisitions) && requisitions.map((req) => (
                <tr key={req.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">REQ-{req.id}</td>
                  {/* --- FIX --- Use requested_by_name from the serializer */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{req.requested_by_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(req.date_requested).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getStatusChip(req.status)}</td>
                  {/* --- FIX --- Display the number of items correctly */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{req.items ? req.items.length : 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-4">
                      <Link to={`/requisitions/${req.id}`} className="text-indigo-600 hover:text-indigo-900">
                        <Eye className="h-5 w-5" />
                      </Link>
                      <Link to={`/requisitions/${req.id}/edit`} className="text-gray-600 hover:text-gray-900">
                        <Edit className="h-5 w-5" />
                      </Link>
                    </div>
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