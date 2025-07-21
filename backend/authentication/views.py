# authentication/views.py
from rest_framework import status, viewsets, filters
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model, authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.db.models import Q, F, Sum, Count
from django.http import HttpResponse, JsonResponse
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.parsers import MultiPartParser, FormParser
import csv
import io
from decimal import Decimal
from .serializers import (
    CustomTokenObtainPairSerializer, 
    UserRegistrationSerializer,
    UserProfileSerializer, 
    UserListSerializer,
    ChangePasswordSerializer
)

User = get_user_model()

class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Custom login view that returns user data along with tokens
    """
    serializer_class = CustomTokenObtainPairSerializer

class RegisterView(TokenObtainPairView):
    """
    Admin registration view - requires authentication
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        # Check if user can create other users
        if not request.user.can_manage_users():
            return Response(
                {'detail': 'You do not have permission to create users.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = UserRegistrationSerializer(
            data=request.data, 
            context={'request': request}
        )
        
        if serializer.is_valid():
            user = serializer.save()
            return Response({
                'user': UserProfileSerializer(user).data,
                'message': 'User created successfully.'
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class PublicRegisterView(TokenObtainPairView):
    """
    Public registration view - no authentication required
    """
    permission_classes = []
    
    def post(self, request):
        # Force role to 'staff' for public registration
        data = request.data.copy()
        data['role'] = 'staff'
        
        serializer = UserRegistrationSerializer(data=data)
        
        if serializer.is_valid():
            user = serializer.save()
            
            # Generate tokens for the new user
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': UserProfileSerializer(user).data,
                'message': 'Registration successful.'
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """
    Logout view that blacklists the refresh token
    """
    try:
        refresh_token = request.data.get('refresh')
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()
        
        return Response({'message': 'Logged out successfully'}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'error': 'Invalid token'}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_profile(request):
    """
    Get current user profile
    """
    serializer = UserProfileSerializer(request.user)
    return Response(serializer.data)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_user_profile(request):
    """
    Update current user profile
    """
    serializer = UserProfileSerializer(
        request.user, 
        data=request.data, 
        partial=True,
        context={'request': request}
    )
    
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    """
    Change user password
    """
    serializer = ChangePasswordSerializer(data=request.data)
    
    if serializer.is_valid():
        user = request.user
        
        # Check old password
        if not user.check_password(serializer.validated_data['old_password']):
            return Response(
                {'old_password': ['Wrong password.']}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Set new password
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        
        return Response({'message': 'Password updated successfully.'})
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_permissions(request):
    """
    Get user permissions and capabilities
    """
    user = request.user
    permissions = {
        'can_access_admin_panel': user.can_access_admin_panel(),
        'can_manage_users': user.can_manage_users(),
        'can_approve_requisitions': user.can_approve_requisitions(),
        'can_manage_inventory': user.can_manage_inventory(),
        'can_create_purchase_orders': user.can_create_purchase_orders(),
        'can_view_financial_reports': user.can_view_financial_reports(),
        'role': user.role,
        'role_display': user.get_role_display(),
    }
    
    return Response(permissions)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_users_list(request):
    """
    Get list of users (admin only)
    """
    if not request.user.can_manage_users():
        return Response(
            {'detail': 'You do not have permission to view users.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Filter users based on requester's role
    queryset = User.objects.all()
    
    # Admins cannot see developers
    if request.user.is_admin:
        queryset = queryset.exclude(role='developer')
    
    # Apply search filter
    search = request.GET.get('search')
    if search:
        queryset = queryset.filter(
            Q(name__icontains=search) |
            Q(email__icontains=search) |
            Q(department__icontains=search)
        )
    
    # Apply role filter
    role = request.GET.get('role')
    if role:
        queryset = queryset.filter(role=role)
    
    # Apply pagination
    page_size = int(request.GET.get('page_size', 20))
    page = int(request.GET.get('page', 1))
    start = (page - 1) * page_size
    end = start + page_size
    
    total = queryset.count()
    users = queryset.order_by('-date_joined')[start:end]
    
    serializer = UserListSerializer(users, many=True)
    
    return Response({
        'results': serializer.data,
        'count': total,
        'page': page,
        'page_size': page_size,
        'total_pages': (total + page_size - 1) // page_size
    })

@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def manage_user(request, user_id):
    """
    Manage individual user (admin only)
    """
    if not request.user.can_manage_users():
        return Response(
            {'detail': 'You do not have permission to manage users.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        user = User.objects.get(id=user_id)
        
        # Admins cannot manage developers
        if request.user.is_admin and user.is_developer:
            return Response(
                {'detail': 'You cannot manage developer accounts.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if request.method == 'GET':
            serializer = UserProfileSerializer(user)
            return Response(serializer.data)
        
        elif request.method == 'PUT':
            serializer = UserProfileSerializer(
                user, 
                data=request.data, 
                partial=True,
                context={'request': request}
            )
            
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        elif request.method == 'DELETE':
            # Users cannot delete themselves
            if user.id == request.user.id:
                return Response(
                    {'detail': 'You cannot delete your own account.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            user.delete()
            return Response({'message': 'User deleted successfully.'})
    
    except User.DoesNotExist:
        return Response(
            {'detail': 'User not found.'},
            status=status.HTTP_404_NOT_FOUND
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_role_choices(request):
    """
    Get available role choices
    """
    roles = User.ROLE_CHOICES
    
    # Filter roles based on user permissions
    if request.user.is_admin:
        # Admins can't assign admin or developer roles
        roles = [role for role in roles if role[0] not in ['developer', 'admin']]
    elif not request.user.can_manage_users():
        # Regular users can only see staff role
        roles = [('staff', 'Staff')]
    
    return Response([{'value': role[0], 'label': role[1]} for role in roles])



    """
    ViewSet for managing inventory items
    """
    queryset = InventoryItem.objects.all()
    serializer_class = InventoryItemSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'location']
    search_fields = ['name', 'sku', 'category', 'location']
    ordering_fields = ['name', 'category', 'current_stock', 'unit_price', 'total_value', 'last_updated']
    ordering = ['name']
    
    def get_queryset(self):
        """
        Filter queryset based on query parameters
        """
        queryset = super().get_queryset()
        
        # Filter by stock status
        status_filter = self.request.query_params.get('status')
        if status_filter == 'out-of-stock':
            queryset = queryset.filter(current_stock=0)
        elif status_filter == 'low-stock':
            queryset = queryset.filter(current_stock__lte=F('reorder_level'), current_stock__gt=0)
        elif status_filter == 'in-stock':
            queryset = queryset.filter(current_stock__gt=F('reorder_level'))
        
        # Filter by low stock only
        low_stock = self.request.query_params.get('low_stock')
        if low_stock and low_stock.lower() == 'true':
            queryset = queryset.filter(current_stock__lte=F('reorder_level'))
        
        return queryset
    
    def perform_create(self, serializer):
        """
        Check permissions before creating inventory item
        """
        if not self.request.user.can_manage_inventory():
            raise PermissionError("You don't have permission to create inventory items.")
        
        # Calculate total value
        instance = serializer.save()
        instance.total_value = instance.current_stock * instance.unit_price
        instance.save()
    
    def perform_update(self, serializer):
        """
        Check permissions and recalculate total value on update
        """
        if not self.request.user.can_manage_inventory():
            raise PermissionError("You don't have permission to update inventory items.")
        
        instance = serializer.save()
        instance.total_value = instance.current_stock * instance.unit_price
        instance.save()
    
    def perform_destroy(self, instance):
        """
        Check permissions before deleting
        """
        if not self.request.user.can_manage_inventory():
            raise PermissionError("You don't have permission to delete inventory items.")
        
        instance.delete()
    
    @action(detail=False, methods=['post'])
    def bulk_delete(self, request):
        """
        Bulk delete inventory items
        """
        if not request.user.can_manage_inventory():
            return Response(
                {'detail': 'You do not have permission to delete inventory items.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        item_ids = request.data.get('ids', [])
        if not item_ids:
            return Response(
                {'detail': 'No item IDs provided.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        deleted_count = InventoryItem.objects.filter(id__in=item_ids).count()
        InventoryItem.objects.filter(id__in=item_ids).delete()
        
        return Response({
            'message': f'{deleted_count} items deleted successfully.'
        })
    
    @action(detail=True, methods=['post'])
    def update_stock(self, request, pk=None):
        """
        Update stock levels for an item
        """
        if not request.user.can_manage_inventory():
            return Response(
                {'detail': 'You do not have permission to update stock.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        item = self.get_object()
        new_stock = request.data.get('current_stock')
        
        if new_stock is None:
            return Response(
                {'detail': 'current_stock is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            new_stock = int(new_stock)
            if new_stock < 0:
                raise ValueError("Stock cannot be negative")
        except (ValueError, TypeError):
            return Response(
                {'detail': 'Invalid stock value.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        item.current_stock = new_stock
        item.total_value = item.current_stock * item.unit_price
        item.save()
        
        serializer = self.get_serializer(item)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def low_stock(self, request):
        """
        Get items with low stock
        """
        low_stock_items = self.queryset.filter(current_stock__lte=F('reorder_level'))
        serializer = self.get_serializer(low_stock_items, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def categories(self, request):
        """
        Get all unique categories
        """
        categories = InventoryItem.objects.values_list('category', flat=True).distinct()
        return Response(sorted(list(categories)))
    
    @action(detail=False, methods=['get'])
    def locations(self, request):
        """
        Get all unique locations
        """
        locations = InventoryItem.objects.values_list('location', flat=True).distinct()
        return Response(sorted(list(locations)))
    
    @action(detail=False, methods=['get'])
    def export(self, request):
        """
        Export inventory data to CSV
        """
        # Get filtered queryset
        queryset = self.filter_queryset(self.get_queryset())
        
        # Create CSV response
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="inventory_export.csv"'
        
        writer = csv.writer(response)
        writer.writerow([
            'Name', 'SKU', 'Category', 'Location', 'Current Stock', 
            'Reorder Level', 'Unit Price', 'Total Value', 'Last Updated'
        ])
        
        for item in queryset:
            writer.writerow([
                item.name, item.sku, item.category, item.location,
                item.current_stock, item.reorder_level, 
                float(item.unit_price), float(item.total_value),
                item.last_updated.strftime('%Y-%m-%d %H:%M:%S')
            ])
        
        return response
    
    @action(detail=False, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def import_csv(self, request):
        """
        Import inventory data from CSV
        """
        if not request.user.can_manage_inventory():
            return Response(
                {'detail': 'You do not have permission to import inventory.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        file_obj = request.data.get('file')
        if not file_obj:
            return Response(
                {'detail': 'No file provided.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Read CSV file
            decoded_file = file_obj.read().decode('utf-8')
            io_string = io.StringIO(decoded_file)
            reader = csv.DictReader(io_string)
            
            created_count = 0
            updated_count = 0
            errors = []
            
            for row_num, row in enumerate(reader, start=2):  # Start at 2 for Excel row numbering
                try:
                    # Required fields
                    name = row.get('Name', '').strip()
                    sku = row.get('SKU', '').strip()
                    
                    if not name or not sku:
                        errors.append(f"Row {row_num}: Name and SKU are required")
                        continue
                    
                    # Get or create item
                    item, created = InventoryItem.objects.get_or_create(
                        sku=sku,
                        defaults={
                            'name': name,
                            'category': row.get('Category', '').strip(),
                            'location': row.get('Location', '').strip(),
                            'current_stock': int(row.get('Current Stock', 0)),
                            'reorder_level': int(row.get('Reorder Level', 0)),
                            'unit_price': Decimal(str(row.get('Unit Price', 0))),
                        }
                    )
                    
                    if created:
                        created_count += 1
                    else:
                        # Update existing item
                        item.name = name
                        item.category = row.get('Category', '').strip()
                        item.location = row.get('Location', '').strip()
                        item.current_stock = int(row.get('Current Stock', item.current_stock))
                        item.reorder_level = int(row.get('Reorder Level', item.reorder_level))
                        item.unit_price = Decimal(str(row.get('Unit Price', item.unit_price)))
                        updated_count += 1
                    
                    # Calculate total value
                    item.total_value = item.current_stock * item.unit_price
                    item.save()
                    
                except (ValueError, TypeError) as e:
                    errors.append(f"Row {row_num}: Invalid data format - {str(e)}")
                except Exception as e:
                    errors.append(f"Row {row_num}: {str(e)}")
            
            return Response({
                'message': f'Import completed. Created: {created_count}, Updated: {updated_count}',
                'created': created_count,
                'updated': updated_count,
                'errors': errors
            })
            
        except Exception as e:
            return Response(
                {'detail': f'Failed to process file: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )