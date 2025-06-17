import React from 'react';

const Settings = () => {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your application settings.</p>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900">General Settings</h2>
        <div className="mt-4 space-y-4">
            <div>
                <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">Company Name</label>
                <input type="text" id="companyName" defaultValue="RedCore360" className="form-input mt-1" />
            </div>
             <div>
                <label htmlFor="timezone" className="block text-sm font-medium text-gray-700">Timezone</label>
                <select id="timezone" className="form-select mt-1">
                    <option>UTC-8:00 Pacific Time (US & Canada)</option>
                    <option>UTC-5:00 Eastern Time (US & Canada)</option>
                    <option selected>UTC+2:00 Central Africa Time</option>
                </select>
            </div>
        </div>
      </div>
      
       <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900">Notification Settings</h2>
         <div className="mt-4 space-y-4">
            <div className="flex items-center">
                <input id="low-stock-alerts" type="checkbox" className="h-4 w-4 text-red-600 border-gray-300 rounded" defaultChecked/>
                <label htmlFor="low-stock-alerts" className="ml-2 block text-sm text-gray-900">Low stock alerts</label>
            </div>
             <div className="flex items-center">
                <input id="po-approved-alerts" type="checkbox" className="h-4 w-4 text-red-600 border-gray-300 rounded" defaultChecked/>
                <label htmlFor="po-approved-alerts" className="ml-2 block text-sm text-gray-900">Purchase order approvals</label>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
