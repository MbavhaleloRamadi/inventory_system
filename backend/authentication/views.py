# authentication/views.py
from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.contrib.auth import authenticate
from django.db.models import Q
from .serializers import (
    CustomTokenObtainPairSerializer,
    UserRegistrationSerializer,
    UserProfileSerializer,
    UserListSerializer,
    LoginSerializer,
    ChangePasswordSerializer
)
from .permissions import CanManageUsers, RoleBasedPermission

User = get_user_model()

class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Custom login view that returns access token, refresh token, and user data
    """
    serializer_class = CustomTokenObtainPairSerializer

class RegisterView(generics.CreateAPIView):
    """
    User registration view - only accessible by users who can manage users
    """
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [IsAuthenticated, CanManageUsers]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        return Response({
            'message': 'User registered successfully',
            'user': {
                'id': user.id,
                'name': user.name,
                'email': user.email,
                'username': user.username,
                'role': user.role,
                'department': user.department,
                'phone': user.phone,
            }
        }, status=status.HTTP_201_CREATED)

class PublicRegisterView(generics.CreateAPIView):
    """
    Public registration view - creates staff users only
    """
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]
    
    def create(self, request, *args, **kwargs):
        # Force role to be 'staff' for public registration
        request.data['role'] = 'staff'
        
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        return Response({
            'message': 'User registered successfully',
            'user': {
                'id': user.id,
                'name': user.name,
                'email': user.email,
                'username': user.username,
                'role': user.role,
            }
        }, status=status.HTTP_201_CREATED)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_profile(request):
    """
    Get current user's profile
    """
    serializer = UserProfileSerializer(request.user)
    return Response(serializer.data)

@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def update_user_profile(request):
    """
    Update current user's profile
    """
    serializer = UserProfileSerializer(
        request.user, 
        data=request.data, 
        partial=request.method == 'PATCH',
        context={'request': request}
    )
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated, CanManageUsers])
def get_users_list(request):
    """
    Get list of all users (admin/developer only)
    """
    users = User.objects.all().order_by('-date_joined')
    
    # Filter by role if specified
    role_filter = request.GET.get('role')
    if role_filter:
        users = users.filter(role=role_filter)
    
    # Search functionality
    search = request.GET.get('search')
    if search:
        users = users.filter(
            Q(name__icontains=search) |
            Q(email__icontains=search) |
            Q(username__icontains=search) |
            Q(department__icontains=search)
        )
    
    # Pagination
    page_size = int(request.GET.get('page_size', 20))
    page = int(request.GET.get('page', 1))
    start = (page - 1) * page_size
    end = start + page_size
    
    total_users = users.count()
    users = users[start:end]
    
    serializer = UserListSerializer(users, many=True)
    
    return Response({
        'users': serializer.data,
        'total': total_users,
        'page': page,
        'page_size': page_size,
        'total_pages': (total_users + page_size - 1) // page_size
    })

@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated, CanManageUsers])
def manage_user(request, user_id):
    """
    Get, update, or delete a specific user
    """
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'GET':
        serializer = UserProfileSerializer(user)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        serializer = UserProfileSerializer(
            user, 
            data=request.data, 
            context={'request': request}
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        # Prevent self-deletion
        if user.id == request.user.id:
            return Response(
                {'error': 'You cannot delete your own account'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Prevent deleting developers if you're not a developer
        if user.is_developer and not request.user.is_developer:
            return Response(
                {'error': 'You cannot delete developer accounts'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        user.delete()
        return Response({'message': 'User deleted successfully'})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    """
    Change user's password
    """
    serializer = ChangePasswordSerializer(data=request.data)
    if serializer.is_valid():
        user = request.user
        
        # Check old password
        if not user.check_password(serializer.validated_data['old_password']):
            return Response(
                {'error': 'Old password is incorrect'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Set new password
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        
        return Response({'message': 'Password changed successfully'})
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """
    Logout user by blacklisting the refresh token
    """
    try:
        RefreshTokennen = request.data.get("RefreshTokennen")
        if RefreshTokennen:
            token = RefreshToken(RefreshTokennen)
            token.blacklist()
        return Response({'message': 'Successfully logged out'}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'error': 'Invalid token'}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_permissions(request):
    """
    Get current user's permissions based on their role
    """
    user = request.user
    permissions = {
        'can_manage_users': user.can_manage_users(),
        'can_approve_requisitions': user.can_approve_requisitions(),
        'can_manage_inventory': user.can_manage_inventory(),
        'can_create_purchase_orders': user.can_create_purchase_orders(),
        'can_view_financial_reports': user.can_view_financial_reports(),
        'can_access_admin_panel': user.can_access_admin_panel(),
        'role': user.role,
        'role_display': user.get_role_display(),
    }
    
    return Response(permissions)

@api_view(['GET'])
@permission_classes([AllowAny])
def get_role_choices(request):
    """
    Get available role choices (for forms)
    """
    # Only show roles that the current user can assign
    roles = User.ROLE_CHOICES
    
    if request.user.is_authenticated:
        if request.user.is_admin:
            # Admins can't create developers or other admins
            roles = [role for role in roles if role[0] not in ['developer', 'admin']]
        elif not request.user.can_manage_users():
            # Regular users can't see role choices
            roles = []
    else:
        # Anonymous users only see staff role
        roles = [('staff', 'Staff')]
    
    return Response({'roles': roles})