import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { requisitionsAPI } from "../../services/api"; // Ensure this exists
import toast from "react-hot-toast";
import { ArrowLeft } from "lucide-react";

const RequisitionDetail = () => {
  const { id } = useParams();
  const [requisition, setRequisition] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequisition = async () => {
      try {
        setLoading(true);
        const response = await requisitionsAPI.get(id); // Ensure this method exists
        setRequisition(response.data);
      } catch (error) {
        console.error("Failed to fetch requisition details:", error);
        toast.error("Failed to load requisition details.");
      } finally {
        setLoading(false);
      }
    };

    fetchRequisition();
  }, [id]);

  if (loading) {
    return (
      <div className="text-center p-8">Loading requisition details...</div>
    );
  }

  if (!requisition) {
    return <div className="text-center p-8">Requisition not found.</div>;
  }

  return (
    <div className="space-y-6">
      <Link
        to="/requisitions"
        className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-5 w-5 mr-2" />
        Back to Requisitions
      </Link>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-2xl font-bold">
          Requisition Details (REQ-{requisition.id})
        </h2>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <p className="font-medium">Requested By:</p>
            {/* --- FIX --- Use requested_by_name */}
            <p>{requisition.requested_by_name}</p>
          </div>
          <div>
            <p className="font-medium">Date Requested:</p>
            <p>{new Date(requisition.date_requested).toLocaleString()}</p>
          </div>
          <div>
            <p className="font-medium">Status:</p>
            <p>{requisition.status}</p>
          </div>
          {requisition.approved_by_name && (
            <div>
              <p className="font-medium">Approved By:</p>
              {/* --- FIX --- Use approved_by_name */}
              <p>{requisition.approved_by_name}</p>
            </div>
          )}
        </div>

        <h3 className="text-xl font-bold mt-6">Items Requested</h3>
        <div className="mt-2 border-t border-gray-200">
          <ul className="divide-y divide-gray-200">
            {/* --- FIX --- Check for requisition.items and map correctly */}
            {Array.isArray(requisition.items) &&
              requisition.items.map((item) => (
                <li
                  key={item.id}
                  className="py-4 flex justify-between items-center"
                >
                  <div>
                    {/* --- FIX --- Access nested item_details.name */}
                    <p className="font-medium">
                      {item.item_details
                        ? item.item_details.name
                        : "Item not found"}
                    </p>
                    <p className="text-sm text-gray-500">
                      SKU: {item.item_details ? item.item_details.sku : "N/A"}
                    </p>
                  </div>
                  <p>Quantity: {item.quantity}</p>
                </li>
              ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default RequisitionDetail;
