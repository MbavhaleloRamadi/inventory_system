# authentication/serializers.py
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password

User = get_user_model()

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Custom token serializer that includes user data in the response
    """
    def validate(self, attrs):
        data = super().validate(attrs)
        
        # Add user data to the response
        data['user'] = {
            'id': self.user.id,
            'email': self.user.email,
            'name': self.user.name,
            'username': self.user.username,
            'role': self.user.role,
            'department': self.user.department,
            'phone': self.user.phone,
            'is_active': self.user.is_active,
            'date_joined': self.user.date_joined,
            'last_login': self.user.last_login,
        }
        
        return data

class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    Serializer for user registration
    """
    password = serializers.CharField(write_only=True, validators=[validate_password])
    confirmPassword = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ('name', 'email', 'password', 'confirmPassword', 'role', 'department', 'phone')
    
    def validate(self, attrs):
        """
        Validate that passwords match and role assignment is valid
        """
        if attrs['password'] != attrs['confirmPassword']:
            raise serializers.ValidationError("Passwords do not match.")
        
        # Check if the requesting user can assign this role
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            requested_role = attrs.get('role', 'staff')
            
            # Only developers and admins can assign roles
            if not request.user.can_manage_users():
                if requested_role != 'staff':
                    raise serializers.ValidationError(
                        "You don't have permission to assign this role."
                    )
            
            # Developers can assign any role, admins can't create other admins or developers
            if request.user.is_admin and requested_role in ['developer', 'admin']:
                raise serializers.ValidationError(
                    "Admins cannot create other admins or developers."
                )
        
        return attrs
    
    def create(self, validated_data):
        """
        Create a new user with encrypted password
        """
        # Remove confirmPassword from validated_data
        validated_data.pop('confirmPassword', None)
        
        # Generate username from email
        email = validated_data['email']
        username = email.split('@')[0]
        
        # Ensure username is unique
        counter = 1
        original_username = username
        while User.objects.filter(username=username).exists():
            username = f"{original_username}{counter}"
            counter += 1
        
        validated_data['username'] = username
        
        # Set created_by if available
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            validated_data['created_by'] = request.user
        
        # Create user with hashed password
        user = User.objects.create_user(**validated_data)
        return user

class UserProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for user profile data
    """
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    
    class Meta:
        model = User
        fields = (
            'id', 'name', 'email', 'username', 'role', 'role_display',
            'department', 'phone', 'is_active', 'date_joined', 'last_login'
        )
        read_only_fields = ('id', 'date_joined', 'last_login', 'username')
    
    def validate_role(self, value):
        """
        Validate role changes
        """
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            # Users can't change their own role
            if self.instance and self.instance.id == request.user.id:
                if value != self.instance.role:
                    raise serializers.ValidationError(
                        "You cannot change your own role."
                    )
            
            # Check if user can assign this role
            if not request.user.can_manage_users():
                raise serializers.ValidationError(
                    "You don't have permission to change user roles."
                )
            
            # Admins can't create other admins or developers
            if request.user.is_admin and value in ['developer', 'admin']:
                raise serializers.ValidationError(
                    "Admins cannot assign admin or developer roles."
                )
        
        return value

class UserListSerializer(serializers.ModelSerializer):
    """
    Serializer for user list (admin view)
    """
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    created_by_name = serializers.CharField(source='created_by.name', read_only=True)
    
    class Meta:
        model = User
        fields = (
            'id', 'name', 'email', 'username', 'role', 'role_display',
            'department', 'phone', 'is_active', 'date_joined', 'last_login',
            'created_by_name'
        )

class LoginSerializer(serializers.Serializer):
    """
    Serializer for login credentials
    """
    email = serializers.EmailField()
    password = serializers.CharField()

class ChangePasswordSerializer(serializers.Serializer):
    """
    Serializer for changing password
    """
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])
    confirm_password = serializers.CharField(required=True)
    
    def validate(self, attrs):
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError("New passwords do not match.")
        return attrs