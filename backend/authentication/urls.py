# authentication/urls.py
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views


urlpatterns = [
    # Authentication endpoints
    path('login/', views.CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('register/', views.RegisterView.as_view(), name='register'),  # Admin registration
    path('register/public/', views.PublicRegisterView.as_view(), name='public_register'),  # Public registration
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('logout/', views.logout_view, name='logout'),
    
    # User profile endpoints
    path('profile/', views.get_user_profile, name='user_profile'),
    path('profile/update/', views.update_user_profile, name='update_profile'),
    path('profile/change-password/', views.change_password, name='change_password'),
    path('permissions/', views.get_user_permissions, name='user_permissions'),
    
    # User management endpoints (admin only)
    path('users/', views.get_users_list, name='users_list'),
    path('users/<int:user_id>/', views.manage_user, name='manage_user'),
    
    # Utility endpoints
    path('roles/', views.get_role_choices, name='role_choices'),
]