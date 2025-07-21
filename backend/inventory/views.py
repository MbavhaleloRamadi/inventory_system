# inventory/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import InventoryItem, Category, Location, Supplier
from .serializers import InventoryItemSerializer, CategorySerializer, LocationSerializer, SupplierSerializer
from rest_framework.permissions import IsAuthenticated

# --- FIX: Combined the two duplicated ViewSets into one correct class ---
class InventoryItemViewSet(viewsets.ModelViewSet):
    queryset = InventoryItem.objects.all()
    serializer_class = InventoryItemSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        # Automatically set the 'updated_by' field to the current user when creating an item
        serializer.save(updated_by=self.request.user)

    @action(detail=False, methods=['post'], url_path='add-stock')
    def add_stock(self, request):
        sku = request.data.get('sku')
        quantity = request.data.get('quantity')

        if not sku or not quantity:
            return Response({'error': 'SKU and quantity are required.'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            item = InventoryItem.objects.get(sku=sku)
            item.quantity += int(quantity)
            item.updated_by = request.user
            item.save()
            return Response(InventoryItemSerializer(item).data)
        except InventoryItem.DoesNotExist:
            return Response({'error': 'Inventory item with this SKU not found.'}, status=status.HTTP_404_NOT_FOUND)
        except (ValueError, TypeError):
            return Response({'error': 'Invalid quantity provided.'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'], url_path='issue-stock')
    def issue_stock(self, request):
        sku = request.data.get('sku')
        quantity = request.data.get('quantity')
        reason = request.data.get('reason')

        if not sku or not quantity or not reason:
            return Response({'error': 'SKU, quantity, and reason are required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            item = InventoryItem.objects.get(sku=sku)
            requested_quantity = int(quantity)

            if item.quantity < requested_quantity:
                return Response({'error': 'Insufficient stock available.'}, status=status.HTTP_400_BAD_REQUEST)

            item.quantity -= requested_quantity
            item.updated_by = request.user
            item.save()
            return Response(InventoryItemSerializer(item).data)
        except InventoryItem.DoesNotExist:
            return Response({'error': 'Inventory item with this SKU not found.'}, status=status.HTTP_404_NOT_FOUND)
        except (ValueError, TypeError):
            return Response({'error': 'Invalid quantity provided.'}, status=status.HTTP_400_BAD_REQUEST)

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]

class LocationViewSet(viewsets.ModelViewSet):
    queryset = Location.objects.all()
    serializer_class = LocationSerializer
    permission_classes = [IsAuthenticated]

class SupplierViewSet(viewsets.ModelViewSet):
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer
    permission_classes = [IsAuthenticated]