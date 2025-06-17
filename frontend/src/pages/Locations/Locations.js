import React from 'react';
import { MapPin, Plus } from 'lucide-react';

const Locations = () => {
    const locations = [
        { id: 1, name: 'Warehouse A', address: '123 Industrial Rd.', items: 120, value: 45000 },
        { id: 2, name: 'Warehouse B', address: '456 Logistics Ave.', items: 85, value: 78000 },
        { id: 3, name: 'Office Storage', address: '789 Corporate Blvd.', items: 35, value: 5500 },
    ];
    
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Locations</h1>
          <p className="text-gray-600">Manage your inventory locations.</p>
        </div>
        <button className="btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          Add Location
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {locations.map(loc => (
            <div key={loc.id} className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center space-x-4">
                    <div className="bg-red-100 p-3 rounded-full">
                        <MapPin className="h-6 w-6 text-red-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">{loc.name}</h3>
                        <p className="text-sm text-gray-500">{loc.address}</p>
                    </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between">
                    <div>
                        <p className="text-xs text-gray-500">Items</p>
                        <p className="text-lg font-bold text-gray-900">{loc.items}</p>
                    </div>
                     <div>
                        <p className="text-xs text-gray-500">Total Value</p>
                        <p className="text-lg font-bold text-green-600">${loc.value.toLocaleString()}</p>
                    </div>
                </div>
            </div>
        ))}
      </div>
    </div>
  );
};

export default Locations;
