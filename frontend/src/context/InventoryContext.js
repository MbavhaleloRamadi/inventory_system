import React, { createContext, useState, useContext, useCallback } from "react";
import { inventoryAPI } from "../services/api";
import toast from "react-hot-toast";

const InventoryContext = createContext();

export const useInventory = () => useContext(InventoryContext);

export const InventoryProvider = ({ children }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
  });

  const fetchItems = useCallback(
    async (params = {}) => {
      setLoading(true);
      try {
        const apiParams = {
          page: params.page || pagination.page,
          page_size: params.pageSize || pagination.pageSize,
          ...params,
        };
        const response = await inventoryAPI.getItems(apiParams);
        setItems(response.data.results || []);
        setPagination((prev) => ({
          ...prev,
          total: response.data.count || 0,
        }));
      } catch (error) {
        console.error("Failed to fetch inventory items:", error);
        toast.error("Failed to load inventory items");
        setItems([]);
      } finally {
        setLoading(false);
      }
    },
    [pagination.page, pagination.pageSize]
  );

  const value = {
    items,
    loading,
    pagination,
    fetchItems,
  };

  return (
    <InventoryContext.Provider value={value}>
      {children}
    </InventoryContext.Provider>
  );
};
