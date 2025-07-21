import React, { useState } from "react";
import { X, Camera, QrCode } from "lucide-react";
import toast from "react-hot-toast";

const ScanItemModal = ({ isOpen, onClose, onItemScanned }) => {
  const [manualEntry, setManualEntry] = useState("");
  const [isManualMode, setIsManualMode] = useState(false);

  if (!isOpen) return null;

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!manualEntry.trim()) {
      toast.error("Please enter a QR code or SKU");
      return;
    }

    try {
      // Simulate scanning process
      toast.success(`Item scanned: ${manualEntry}`);
      if (onItemScanned) {
        onItemScanned(manualEntry);
      }
      setManualEntry("");
      setIsManualMode(false);
      onClose();
    } catch (error) {
      toast.error("Failed to scan item");
    }
  };

  const simulateScan = () => {
    // Simulate a successful scan
    const mockSku = "SKU" + Math.floor(Math.random() * 1000000);
    toast.success(`Item scanned: ${mockSku}`);
    if (onItemScanned) {
      onItemScanned(mockSku);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Scan Item</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {!isManualMode ? (
          <>
            <div className="relative w-full aspect-square bg-gray-900 rounded-lg flex items-center justify-center overflow-hidden mb-4">
              <Camera className="h-24 w-24 text-gray-600" />
              <div className="absolute inset-0 border-4 border-dashed border-green-500 rounded-lg m-8"></div>
              <p className="absolute bottom-4 text-white text-sm bg-black bg-opacity-50 px-2 py-1 rounded">
                Position QR code within the frame
              </p>
            </div>
            <div className="text-center space-y-3">
              <p className="text-gray-600">Camera feed simulation</p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={simulateScan}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <Camera className="h-4 w-4 inline mr-2" />
                  Simulate Scan
                </button>
                <button
                  onClick={() => setIsManualMode(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <QrCode className="h-4 w-4 inline mr-2" />
                  Manual Entry
                </button>
              </div>
            </div>
          </>
        ) : (
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="manual-entry"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Enter QR Code or SKU
              </label>
              <input
                type="text"
                id="manual-entry"
                value={manualEntry}
                onChange={(e) => setManualEntry(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter code manually"
                autoFocus
                required
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsManualMode(false)}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Back to Camera
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Scan Item
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ScanItemModal;