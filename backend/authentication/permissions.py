# authentication/permissions.py
from rest_framework import permissions

class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object to edit it.
    """
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any request,
        # so we'll always allow GET, HEAD or OPTIONS requests.
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Write permissions are only allowed to the owner of the object.
        return obj.owner == request.user

class IsDeveloper(permissions.BasePermission):
    """
    Custom permission to only allow developers.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_developer)

class IsAdmin(permissions.BasePermission):
    """
    Custom permission to only allow admins.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_admin)

class IsManager(permissions.BasePermission):
    """
    Custom permission to only allow managers and above.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and 
                   request.user.role in ['developer', 'admin', 'manager'])

class IsAdminOrManager(permissions.BasePermission):
    """
    Custom permission to only allow admins and managers.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and 
                   request.user.role in ['developer', 'admin', 'manager'])

class CanManageUsers(permissions.BasePermission):
    """
    Custom permission for user management.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.can_manage_users())

class CanManageInventory(permissions.BasePermission):
    """
    Custom permission for inventory management.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.can_manage_inventory())

class CanCreatePurchaseOrders(permissions.BasePermission):
    """
    Custom permission for purchase order creation.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.can_create_purchase_orders())

class CanApproveRequisitions(permissions.BasePermission):
    """
    Custom permission for requisition approval.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.can_approve_requisitions())

class CanViewFinancialReports(permissions.BasePermission):
    """
    Custom permission for viewing financial reports.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.can_view_financial_reports())

class RoleBasedPermission(permissions.BasePermission):
    """
    Generic role-based permission class.
    Views can specify required_roles to control access.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Check if view has required_roles attribute
        if hasattr(view, 'required_roles'):
            return request.user.role in view.required_roles
        
        # Default to allowing authenticated users
        return True

    def has_object_permission(self, request, view, obj):
        # Check if the user has permission to access this specific object
        if hasattr(view, 'required_roles'):
            return request.user.role in view.required_roles
        return True