# serializers.py
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
        fields = ('name', 'email', 'password', 'confirmPassword')
    
    def validate(self, attrs):
        """
        Validate that passwords match
        """
        if attrs['password'] != attrs['confirmPassword']:
            raise serializers.ValidationError("Passwords do not match.")
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
        
        # Create user with hashed password
        user = User.objects.create_user(**validated_data)
        return user

class UserProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for user profile data
    """
    class Meta:
        model = User
        fields = ('id', 'name', 'email', 'username', 'date_joined', 'last_login')
        read_only_fields = ('id', 'date_joined', 'last_login')

class LoginSerializer(serializers.Serializer):
    """
    Serializer for login credentials
    """
    email = serializers.EmailField()
    password = serializers.CharField()