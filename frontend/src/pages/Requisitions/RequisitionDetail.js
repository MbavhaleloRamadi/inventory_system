import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Printer, CheckCircle, Truck, XCircle } from 'lucide-react';

const RequisitionDetail = () => {
    const { id } = useParams();
    // Mock data
    const requisition = {
        id: id,
        requestedBy: 'John Doe',
        department: 'Construction Site B',
        status: 'Approved',
        date: '2025-06-11',
        items: [
            { id: 1, name: 'Safety Helmet', sku: 'SH-001', quantity: 10 },
            { id: 2, name: 'Steel Pipe', sku: 'SP-003', quantity: 20 },
            { id: 3, name: 'Cement Bag', sku: 'CM-001', quantity: 50 },
        ]
    };

  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
            <Link to="/requisitions" className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-700">
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Requisitions
            </Link>
            <div className="flex space-x-3">
                 <button className="btn-secondary"><Printer className="h-4 w-4 mr-2" /> Print</button>
                {requisition.status === 'Pending' && (
                    <>
                        <button className="btn-success"><CheckCircle className="h-4 w-4 mr-2" /> Approve</button>
                        <button className="btn-danger"><XCircle className="h-4 w-4 mr-2" /> Reject</button>
                    </>
                )}
                 {requisition.status === 'Approved' && (
                    <button className="btn-primary"><Truck className="h-4 w-4 mr-2" /> Mark as Dispatched</button>
                )}
            </div>
        </div>
      
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-start">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Requisition #{requisition.id}</h2>
                <p className="text-gray-500">From: {requisition.department}</p>
                <p className="text-gray-500">Requested by: {requisition.requestedBy}</p>
                <p className="text-gray-500">Date: {requisition.date}</p>
            </div>
            <div>
                <span className={`px-3 py-1 text-sm font-semibold rounded-full ${requisition.status === 'Approved' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {requisition.status}
                </span>
            </div>
        </div>
        
        <div className="mt-8 flow-root">
            <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                    <table className="min-w-full divide-y divide-gray-300">
                        <thead>
                            <tr>
                                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">Item</th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">SKU</th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Quantity Requested</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {requisition.items.map((item) => (
                                <tr key={item.id}>
                                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-0">{item.name}</td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{item.sku}</td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{item.quantity}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default RequisitionDetail;
