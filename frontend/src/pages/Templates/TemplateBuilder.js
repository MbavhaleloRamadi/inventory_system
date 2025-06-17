import React from 'react';
import { Columns, Plus, Save } from 'lucide-react';

const TemplateBuilder = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Template Builder</h1>
          <p className="text-gray-600">Customize forms and templates for your items.</p>
        </div>
        <button className="btn-primary">
          <Save className="h-4 w-4 mr-2" />
          Save Template
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Available Fields */}
        <div className="lg:col-span-1 bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Available Fields</h2>
            <div className="space-y-2">
                <div className="p-2 border rounded-md cursor-move bg-gray-50">Text Field</div>
                <div className="p-2 border rounded-md cursor-move bg-gray-50">Number Field</div>
                <div className="p-2 border rounded-md cursor-move bg-gray-50">Date Field</div>
                <div className="p-2 border rounded-md cursor-move bg-gray-50">Dropdown</div>
                <div className="p-2 border rounded-md cursor-move bg-gray-50">Checkbox</div>
            </div>
             <button className="btn-secondary mt-4 w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Custom Field
            </button>
        </div>

        {/* Template Preview */}
        <div className="lg:col-span-2 bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Item Template Preview</h2>
            <div className="space-y-4 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Columns className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Drag and drop fields here</h3>
                <p className="mt-1 text-sm text-gray-500">Build your custom item form.</p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateBuilder;
