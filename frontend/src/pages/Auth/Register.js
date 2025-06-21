import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth'; // ✅ correct path


const Registration = () => {
  const { register, loading: authLoading } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Client-side validation
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      // Use the register function from AuthContext
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        // Note: confirmPassword is typically not sent to the server
        // as validation happens on the client side
      });

      // Reset form on successful registration
      setFormData({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
      });

      // Success message and redirect logic can be handled in AuthContext
      // or you can add navigation logic here if needed
      
    } catch (error) {
      console.error('Registration failed:', error);
      
      // Handle server-side validation errors
      if (error.response?.data) {
        const serverErrors = error.response.data;
        
        // Map server errors to form fields
        const mappedErrors = {};
        
        // Handle different error formats
        if (serverErrors.email) {
          mappedErrors.email = Array.isArray(serverErrors.email) 
            ? serverErrors.email.join(', ') 
            : serverErrors.email;
        }
        
        if (serverErrors.password) {
          mappedErrors.password = Array.isArray(serverErrors.password) 
            ? serverErrors.password.join(', ') 
            : serverErrors.password;
        }
        
        if (serverErrors.name) {
          mappedErrors.name = Array.isArray(serverErrors.name) 
            ? serverErrors.name.join(', ') 
            : serverErrors.name;
        }
        
        // Handle non-field errors
        if (serverErrors.non_field_errors) {
          mappedErrors.general = Array.isArray(serverErrors.non_field_errors) 
            ? serverErrors.non_field_errors.join(', ') 
            : serverErrors.non_field_errors;
        }
        
        // Handle detail error message
        if (serverErrors.detail && !Object.keys(mappedErrors).length) {
          mappedErrors.general = serverErrors.detail;
        }
        
        setErrors(mappedErrors);
      } else {
        setErrors({ general: 'Registration failed. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const renderFieldError = (fieldName) => {
    if (errors[fieldName]) {
      return (
        <div className="text-red-600 text-sm mt-1">
          {errors[fieldName]}
        </div>
      );
    }
    return null;
  };

  const isLoading = loading || authLoading;

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Register</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Full Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.name ? 'border-red-500' : 'border-gray-300'
            }`}
            required
            placeholder="Enter your full name"
            disabled={isLoading}
          />
          {renderFieldError('name')}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email *
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.email ? 'border-red-500' : 'border-gray-300'
            }`}
            required
            placeholder="Enter your email address"
            disabled={isLoading}
          />
          {renderFieldError('email')}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Password *
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.password ? 'border-red-500' : 'border-gray-300'
            }`}
            required
            minLength={8}
            placeholder="Enter a strong password"
            disabled={isLoading}
          />
          {renderFieldError('password')}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
            Confirm Password *
          </label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
            }`}
            required
            placeholder="Confirm your password"
            disabled={isLoading}
          />
          {renderFieldError('confirmPassword')}
        </div>

        {errors.general && (
          <div className="text-red-600 text-sm p-3 bg-red-50 rounded">
            {errors.general}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Registering...' : 'Register'}
        </button>
      </form>
    </div>
  );
};

export default Registration;