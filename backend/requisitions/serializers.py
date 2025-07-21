# requisitions/serializers.py
from rest_framework import serializers
from .models import Requisition, RequisitionItem
from inventory.serializers import InventoryItemSerializer

class RequisitionItemSerializer(serializers.ModelSerializer):
    item_details = InventoryItemSerializer(source='item', read_only=True)

    class Meta:
        model = RequisitionItem
        fields = ['id', 'item', 'quantity', 'item_details']

class RequisitionSerializer(serializers.ModelSerializer):
    items = RequisitionItemSerializer(many=True)
    requested_by_name = serializers.CharField(source='requested_by.name', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.name', read_only=True, allow_null=True)

    class Meta:
        model = Requisition
        fields = '__all__'

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        requisition = Requisition.objects.create(**validated_data)
        for item_data in items_data:
            RequisitionItem.objects.create(requisition=requisition, **item_data)
        return requisition