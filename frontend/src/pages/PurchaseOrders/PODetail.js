import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Printer, CheckCircle, Truck } from 'lucide-react';

const PODetail = () => {
    const { id } = useParams();
    // Mock data
    const po = {
        id: id,
        supplier: 'Global Tools Inc.',
        status: 'Approved',
        total: 1500.00,
        date: '2025-06-10',
        items: [
            { id: 1, name: 'Heavy Duty Power Drill', sku: 'PD-HD-002', quantity: 10, unit_price: 129.99 },
            { id: 2, name: 'Drill Bit Set (30-piece)', sku: 'DBS-30', quantity: 5, unit_price: 40.02 },
        ]
    };

  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
            <Link to="/purchase-orders" className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-700">
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Purchase Orders
            </Link>
            <div className="flex space-x-3">
                <button className="btn-secondary"><Printer className="h-4 w-4 mr-2" /> Print</button>
                {po.status === 'Approved' && (
                    <button className="btn-primary"><Truck className="h-4 w-4 mr-2" /> Mark as Received</button>
                )}
                {po.status === 'Pending' && (
                    <button className="btn-success"><CheckCircle className="h-4 w-4 mr-2" /> Approve</button>
                )}
            </div>
        </div>
      
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-start">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Purchase Order #{po.id}</h2>
                <p className="text-gray-500">To: {po.supplier}</p>
                <p className="text-gray-500">Date: {po.date}</p>
            </div>
            <div>
                <span className={`px-3 py-1 text-sm font-semibold rounded-full ${po.status === 'Approved' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                    {po.status}
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
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Quantity</th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Unit Price</th>
                                <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0 text-right text-sm font-semibold text-gray-900">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {po.items.map((item) => (
                                <tr key={item.id}>
                                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-0">{item.name}</td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{item.sku}</td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{item.quantity}</td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">${item.unit_price.toFixed(2)}</td>
                                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">${(item.quantity * item.unit_price).toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr>
                                <th scope="row" colSpan="4" className="hidden pl-4 pr-3 pt-4 text-right text-sm font-semibold text-gray-900 sm:table-cell sm:pl-0">Grand Total</th>
                                <th scope="row" className="pl-4 pr-3 pt-4 text-left text-sm font-semibold text-gray-900 sm:hidden">Grand Total</th>
                                <td className="pl-3 pr-4 pt-4 text-right text-sm font-semibold text-gray-900 sm:pr-0">${po.total.toFixed(2)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default PODetail;
