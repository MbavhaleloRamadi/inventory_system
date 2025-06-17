import React from 'react';
import { BarChart3, Download } from 'lucide-react';

const Reports = () => {
    const reports = [
        { name: 'Inventory Valuation', description: 'Current value of all stock on hand.' },
        { name: 'Stock Movement Report', description: 'Detailed history of all stock movements.' },
        { name: 'Low Stock Report', description: 'Items that are at or below their reorder level.' },
        { name: 'Expiry Date Report', description: 'Items nearing their expiration date.' },
    ];

  return (
    <div className="space-y-6">
      <div className="flex items-center">
  <BarChart3 className="h-8 w-8 text-gray-400 mr-3" />
  <div>
    <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
    <p className="text-gray-600">Generate and download reports for your inventory.</p>
  </div>
</div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reports.map(report => (
            <div key={report.name} className="bg-white shadow rounded-lg p-6 flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">{report.name}</h3>
                    <p className="text-sm text-gray-500">{report.description}</p>
                </div>
                <button className="btn-secondary">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                </button>
            </div>
        ))}
      </div>
    </div>
  );
};

export default Reports;
