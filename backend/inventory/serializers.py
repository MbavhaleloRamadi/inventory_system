# inventory/serializers.py
from rest_framework import serializers
from .models import InventoryItem, Category, Location, Supplier

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'

class LocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Location
        fields = '__all__'

class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = '__all__'

class InventoryItemSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    location_name = serializers.CharField(source='location.name', read_only=True)
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    is_low_stock = serializers.ReadOnlyField()
    is_expired = serializers.ReadOnlyField() # New field

    class Meta:
        model = InventoryItem
        fields = [
            'id', 'name', 'sku', 'description', 'category', 'category_name',
            'location', 'location_name', 'supplier', 'supplier_name', 'quantity',
            'reorder_level', 'unit_price', 'batch_number', 'expiry_date',
            'condition', 'date_added', 'last_updated', 'updated_by', 'is_low_stock',
            'is_expired'
        ]