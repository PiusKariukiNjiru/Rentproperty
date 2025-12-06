import React, { useState, useContext, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../contexts/AppContext';
import { AppContextType, UserType, User } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import { EyeIcon, EyeSlashIcon, UserCircleIcon, BuildingOfficeIcon, CheckCircleIcon, XCircleIcon, ExclamationCircleIcon } from '../components/icons';
import { useToast } from '../contexts/ToastContext';

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
}

const AuthPage: React.FC = () => {
  const { login, signup, currentUser, isLoading } = useContext(AppContext) as AppContextType;
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [userType, setUserType] = useState<UserType>(UserType.Tenant);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [networkError, setNetworkError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (currentUser) {
      navigate('/');
    }
  }, [currentUser, navigate]);

  // Reset form when switching between login/signup
  useEffect(() => {
    if (isLogin) {
      setName('');
      setPhone('');
    }
    setErrors({});
    setTouched({});
    setPassword('');
    setShowPassword(false);
    setApiError(null);
    setNetworkError(false);
    setRetryCount(0);
  }, [isLogin]);

  // Focus email input on mount
  useEffect(() => {
    emailInputRef.current?.focus();
  }, []);

  // Email validation - consistent for both login and signup
  const validateEmail = (email: string, isLoginMode: boolean): string | undefined => {
    if (!email.trim()) {
      return 'Email is required';
    }
    
    // For login: just check it's not empty and has @ symbol
    if (isLoginMode) {
      if (!email.includes('@')) {
        return 'Please enter a valid email address';
      }
      return undefined;
    }
    
    // For signup: stricter validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address';
    }
    return undefined;
  };

  // Password validation - simplified, no trim check
  const validatePassword = (password: string, isLoginMode: boolean): string | undefined => {
    if (!password) {
      return 'Password is required';
    }
    
    // For login: just check it's not empty (backend will validate)
    if (isLoginMode) {
      return undefined;
    }
    
    // For signup: validation (removed length > 128 check since HTML maxLength handles it)
    if (password.length < 6) {
      return 'Password must be at least 6 characters';
    }
    // Check for at least one letter and one number
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    if (!hasLetter || !hasNumber) {
      return 'Password should contain both letters and numbers';
    }
    return undefined;
  };

  // Name validation - removed length > 100 check
  const validateName = (name: string): string | undefined => {
    if (!name.trim()) {
      return 'Full name is required';
    }
    if (name.trim().length < 2) {
      return 'Name must be at least 2 characters';
    }
    // Removed max length check - HTML maxLength attribute handles it
    // Check for valid name format (letters, spaces, hyphens, apostrophes)
    const nameRegex = /^[a-zA-Z\s'-]+$/;
    if (!nameRegex.test(name.trim())) {
      return 'Name can only contain letters, spaces, hyphens, and apostrophes';
    }
    return undefined;
  };

  // Phone validation
  const validatePhone = (phone: string): string | undefined => {
    if (!phone.trim()) {
      return 'Phone number is required';
    }
    // Remove common formatting characters
    const cleanedPhone = phone.replace(/[\s\-\(\)\+]/g, '');
    // Check if it's all digits and has reasonable length
    if (!/^\d+$/.test(cleanedPhone)) {
      return 'Phone number must contain only digits';
    }
    if (cleanedPhone.length < 10 || cleanedPhone.length > 15) {
      return 'Phone number must be between 10 and 15 digits';
    }
    return undefined;
  };

  // Format phone number as user types
  const formatPhoneNumber = (value: string): string => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  };

  // Validate single field - streamlined, uses same functions for both modes
  const validateField = (name: string, value: string): string | undefined => {
    switch (name) {
      case 'email':
        return validateEmail(value, isLogin);
      case 'password':
        return validatePassword(value, isLogin);
      case 'name':
        return validateName(value);
      case 'phone':
        return validatePhone(value);
      default:
        return undefined;
    }
  };

  // Handle field blur - streamlined validation
  const handleBlur = (fieldName: string) => {
    setTouched((prev: Record<string, boolean>) => ({ ...prev, [fieldName]: true }));
    const value = fieldName === 'email' ? email : 
                  fieldName === 'password' ? password :
                  fieldName === 'name' ? name : phone;
    const error = validateField(fieldName, value);
    setErrors((prev: FormErrors) => {
      if (error) {
        return { ...prev, [fieldName]: error };
      } else {
        const newErrors = { ...prev };
        delete newErrors[fieldName as keyof FormErrors];
        return newErrors;
      }
    });
  };

  // Handle field change - email always trimmed and lowercased for consistency
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Always trim and lowercase email for consistency (prevents login issues)
    const value = e.target.value.trim().toLowerCase();
    setEmail(value);
    if (touched.email) {
      const error = validateEmail(value, isLogin);
      setErrors((prev: FormErrors) => {
        if (error) {
          return { ...prev, email: error };
        } else {
          const newErrors = { ...prev };
          delete newErrors.email;
          return newErrors;
        }
      });
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Don't trim password - passwords can legitimately have spaces
    const value = e.target.value;
    setPassword(value);
    if (touched.password) {
      const error = validatePassword(value, isLogin);
      setErrors((prev: FormErrors) => {
        if (error) {
          return { ...prev, password: error };
        } else {
          const newErrors = { ...prev };
          delete newErrors.password;
          return newErrors;
        }
      });
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setName(value);
    if (touched.name) {
      const error = validateName(value);
      setErrors((prev: FormErrors) => {
        if (error) {
          return { ...prev, name: error };
        } else {
          const newErrors = { ...prev };
          delete newErrors.name;
          return newErrors;
        }
      });
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhone(formatted);
    if (touched.phone) {
      const error = validatePhone(formatted);
      setErrors((prev: FormErrors) => {
        if (error) {
          return { ...prev, phone: error };
        } else {
          const newErrors = { ...prev };
          delete newErrors.phone;
          return newErrors;
        }
      });
    }
  };

  // Get password strength
  const getPasswordStrength = (password: string): { strength: 'weak' | 'medium' | 'strong'; text: string; color: string } => {
    if (!password || password.length < 6) {
      return { strength: 'weak', text: 'Too short', color: 'text-danger' };
    }
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const length = password.length;

    if (length >= 8 && hasLetter && hasNumber && hasSpecial) {
      return { strength: 'strong', text: 'Strong', color: 'text-success' };
    }
    if (length >= 6 && hasLetter && hasNumber) {
      return { strength: 'medium', text: 'Medium', color: 'text-warning' };
    }
    return { strength: 'weak', text: 'Weak', color: 'text-danger' };
  };

  // Validate entire form - streamlined
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    // Use same validation functions for both modes
    const emailError = validateEmail(email, isLogin);
    if (emailError) newErrors.email = emailError;

    const passwordError = validatePassword(password, isLogin);
    if (passwordError) newErrors.password = passwordError;

    if (!isLogin) {
      const nameError = validateName(name);
      if (nameError) newErrors.name = nameError;

      const phoneError = validatePhone(phone);
      if (phoneError) newErrors.phone = phoneError;
    }

    setErrors(newErrors);
    setTouched({
      email: true,
      password: true,
      ...(isLogin ? {} : { name: true, phone: true })
    });

    return Object.keys(newErrors).length === 0;
  };

  // Enhanced error handler for API responses
  const handleApiError = async (response: Response, defaultMessage: string): Promise<string> => {
    let errorMessage = defaultMessage;
    
    try {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        
        // Handle validation errors from express-validator
        if (data.errors && Array.isArray(data.errors)) {
          const errorMessages = data.errors.map((err: { msg: string; param?: string }) => {
            // Map backend field names to frontend field names
            const fieldMap: Record<string, string> = {
              'email': 'email',
              'password': 'password',
              'name': 'name',
              'phone': 'phone',
              'userType': 'userType'
            };
            
            const fieldName = err.param ? fieldMap[err.param] || err.param : undefined;
            
            // Set field-specific error if applicable
            if (fieldName && fieldName !== 'userType') {
              setErrors(prev => ({ ...prev, [fieldName]: err.msg }));
            }
            
            return err.msg;
          });
          
          errorMessage = errorMessages.join(', ');
        } else if (data.msg) {
          errorMessage = data.msg;
        } else if (data.message) {
          errorMessage = data.message;
        } else if (typeof data === 'string') {
          errorMessage = data;
        }
      } else {
        // Try to get text response
        const text = await response.text();
        if (text) {
          errorMessage = text;
        }
      }
    } catch (parseError) {
      console.error('Error parsing error response:', parseError);
      // Use default message if parsing fails
    }
    
    // Handle specific HTTP status codes
    switch (response.status) {
      case 400:
        errorMessage = errorMessage || 'Invalid request. Please check your input.';
        break;
      case 401:
        errorMessage = errorMessage || 'Invalid email or password.';
        break;
      case 403:
        errorMessage = errorMessage || 'Access denied.';
        break;
      case 404:
        errorMessage = errorMessage || 'Service not found.';
        break;
      case 409:
        errorMessage = errorMessage || 'An account with this email already exists.';
        break;
      case 422:
        errorMessage = errorMessage || 'Validation failed. Please check your input.';
        break;
      case 429:
        errorMessage = 'Too many requests. Please try again later.';
        break;
      case 500:
        errorMessage = 'Server error. Please try again later.';
        break;
      case 503:
        errorMessage = 'Service temporarily unavailable. Please try again later.';
        break;
      default:
        if (response.status >= 500) {
          errorMessage = 'Server error. Please try again later.';
        } else if (response.status >= 400) {
          errorMessage = errorMessage || 'Request failed. Please try again.';
        }
    }
    
    return errorMessage;
  };

  const performAuth = async () => {
    if (isLogin) {
      // Email is already trimmed and lowercased in handleEmailChange
      await login(email, password, userType);
    } else {
      const newUser: Omit<User, 'id' | 'favoriteProperties' | 'idVerified'> = {
        name: name.trim(),
        email: email, // Already trimmed and lowercased
        phone: phone.replace(/\D/g, ''), // Store phone without formatting
        userType,
        profilePicture: `https://picsum.photos/seed/${email.split('@')[0]}/200`,
        employmentDetails: '',
      };
      await signup({ ...newUser, password });
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    
    if (isSubmitting || isLoading) return;

    // Clear previous API errors
    setApiError(null);
    setNetworkError(false);
    setErrors({});

    // Validate form
    if (!validateForm()) {
      addToast('Please fix the errors in the form', 'error');
      // Focus first error field
      const firstErrorField = Object.keys(errors)[0];
      if (firstErrorField === 'email') emailInputRef.current?.focus();
      return;
    }

    setIsSubmitting(true);

    try {
      await performAuth();
    } catch (error: any) {
      // Enhanced error handling
      let errorMessage = 'An unexpected error occurred. Please try again.';
      
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        // Network error
        setNetworkError(true);
        errorMessage = 'Network error. Please check your internet connection and try again.';
        addToast(errorMessage, 'error');
      } else if (error.name === 'AbortError' || error.message?.includes('timeout')) {
        errorMessage = 'Request timed out. Please try again.';
        addToast(errorMessage, 'error');
      } else if (error.response) {
        // Response error (if using axios or similar)
        errorMessage = await handleApiError(error.response, errorMessage);
        setApiError(errorMessage);
        addToast(errorMessage, 'error');
      } else if (error.message) {
        // Error with message
        errorMessage = error.message;
        setApiError(errorMessage);
        addToast(errorMessage, 'error');
      } else {
        // Unknown error
        setApiError(errorMessage);
        addToast(errorMessage, 'error');
      }
      
      console.error('Auth error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleMode = () => {
    setIsLogin(!isLogin);
    setErrors({});
    setTouched({});
  };

  const passwordStrength = !isLogin && password ? getPasswordStrength(password) : null;
  const hasErrors = Object.keys(errors).length > 0;
  
  // Simplified form validity check - directly check required fields and absence of errors
  const isFormValid = !hasErrors && 
    email.trim() && 
    password && 
    (isLogin || (name.trim() && phone.trim()));

  // Get reason why button is disabled - simplified logic
  const getDisabledReason = (): string | null => {
    if (isLoading || isSubmitting) {
      return isLogin ? 'Logging in...' : 'Creating account...';
    }
    
    // Simplified check - no redundant .trim() calls
    const missingFields: string[] = [];
    
    if (!email.trim()) {
      missingFields.push('Email');
    }
    if (!password) {
      missingFields.push('Password');
    }
    if (!isLogin) {
      if (!name.trim()) {
        missingFields.push('Full Name');
      }
      if (!phone.trim()) {
        missingFields.push('Phone Number');
      }
    }
    
    if (missingFields.length > 0) {
      return `Please fill in: ${missingFields.join(', ')}`;
    }
    
    if (hasErrors) {
      const errorFields = Object.keys(errors).map(field => {
        const fieldNames: Record<string, string> = {
          email: 'Email',
          password: 'Password',
          name: 'Full Name',
          phone: 'Phone Number'
        };
        return fieldNames[field] || field;
      });
      return `Please fix errors in: ${errorFields.join(', ')}`;
    }
    
    return null;
  };

  const disabledReason = getDisabledReason();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary to-secondary p-4">
      <div className="bg-white p-8 sm:p-10 rounded-xl shadow-2xl w-full max-w-md transform transition-all hover:scale-[1.01] duration-300">
        <h2 className="text-3xl font-bold text-center text-primary mb-3">
          {isLogin ? 'Welcome Back!' : 'Create Account'}
        </h2>
        <p className="text-center text-neutral-dark mb-6 text-sm">
          {isLogin ? 'Sign in to access your account' : 'Get started with LocalRent today'}
        </p>

        <div className="mb-6">
          <div className="flex justify-center mb-2" role="tablist" aria-label="User type selection">
            <button
              type="button"
              onClick={() => setUserType(UserType.Tenant)}
              className={`px-5 py-2.5 rounded-l-md flex items-center space-x-2 transition-all duration-200 text-sm font-medium border-y border-l ${
                userType === UserType.Tenant
                  ? 'bg-primary text-white shadow-md border-primary'
                  : 'bg-neutral-light text-neutral-dark hover:bg-neutral border-neutral'
              }`}
              aria-pressed={userType === UserType.Tenant}
              aria-label="Select Tenant"
            >
              <UserCircleIcon className="w-5 h-5" />
              <span>I'm a Tenant</span>
            </button>
            <button
              type="button"
              onClick={() => setUserType(UserType.Landlord)}
              className={`px-5 py-2.5 rounded-r-md flex items-center space-x-2 transition-all duration-200 text-sm font-medium border ${
                userType === UserType.Landlord
                  ? 'bg-primary text-white shadow-md border-primary'
                  : 'bg-neutral-light text-neutral-dark hover:bg-neutral border-neutral'
              }`}
              aria-pressed={userType === UserType.Landlord}
              aria-label="Select Landlord"
            >
              <BuildingOfficeIcon className="w-5 h-5" />
              <span>I'm a Landlord</span>
            </button>
          </div>
          <p className="text-center text-xs text-neutral-dark">
            You are {isLogin ? 'logging in' : 'signing up'} as a{' '}
            <span className="font-semibold">{userType}</span>.
          </p>
        </div>

        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="space-y-5"
          noValidate
          aria-label={isLogin ? 'Login form' : 'Sign up form'}
        >
          {!isLogin && (
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-neutral-dark mb-1">
                Full Name <span className="text-danger" aria-label="required">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={name}
                  onChange={handleNameChange}
                  onBlur={() => handleBlur('name')}
                  required={!isLogin}
                  autoComplete="name"
                  aria-required="true"
                  aria-invalid={touched.name && errors.name ? 'true' : 'false'}
                  aria-describedby={touched.name && errors.name ? 'name-error' : undefined}
                  className={`mt-1 block w-full px-4 py-2.5 border rounded-md shadow-sm focus:outline-none focus:ring-2 sm:text-sm transition-shadow text-white placeholder-gray-400 bg-neutral-darker ${
                    touched.name && errors.name
                      ? 'border-danger focus:ring-danger focus:border-danger'
                      : touched.name && !errors.name && name
                      ? 'border-success focus:ring-primary focus:border-primary'
                      : 'border-neutral focus:ring-primary focus:border-primary'
                  }`}
                  placeholder="e.g. John Doe"
                  maxLength={100}
                />
                {touched.name && !errors.name && name && (
                  <CheckCircleIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-success" aria-hidden="true" />
                )}
                {touched.name && errors.name && (
                  <XCircleIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-danger" aria-hidden="true" />
                )}
              </div>
              {touched.name && errors.name && (
                <p id="name-error" className="mt-1 text-sm text-danger" role="alert">
                  {errors.name}
                </p>
              )}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-neutral-dark mb-1">
              Email Address <span className="text-danger" aria-label="required">*</span>
            </label>
            <div className="relative">
              <input
                ref={emailInputRef}
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={handleEmailChange}
                onBlur={() => handleBlur('email')}
                required={!isLogin}
                autoComplete="email"
                aria-required="true"
                aria-invalid={touched.email && errors.email ? 'true' : 'false'}
                aria-describedby={touched.email && errors.email ? 'email-error' : undefined}
                className={`mt-1 block w-full px-4 py-2.5 border rounded-md shadow-sm focus:outline-none focus:ring-2 sm:text-sm transition-shadow text-white placeholder-gray-400 bg-neutral-darker ${
                  touched.email && errors.email
                    ? 'border-danger focus:ring-danger focus:border-danger'
                    : touched.email && !errors.email && email
                    ? 'border-success focus:ring-primary focus:border-primary'
                    : 'border-neutral focus:ring-primary focus:border-primary'
                }`}
                placeholder={isLogin ? "Enter your email" : "you@example.com"}
              />
              {touched.email && !errors.email && email && (
                <CheckCircleIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-success" aria-hidden="true" />
              )}
              {touched.email && errors.email && (
                <XCircleIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-danger" aria-hidden="true" />
              )}
            </div>
            {touched.email && errors.email && (
              <p id="email-error" className="mt-1 text-sm text-danger" role="alert">
                {errors.email}
              </p>
            )}
          </div>

          {!isLogin && (
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-neutral-dark mb-1">
                Phone Number <span className="text-danger" aria-label="required">*</span>
              </label>
              <div className="relative">
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={phone}
                  onChange={handlePhoneChange}
                  onBlur={() => handleBlur('phone')}
                  required={!isLogin}
                  autoComplete="tel"
                  aria-required="true"
                  aria-invalid={touched.phone && errors.phone ? 'true' : 'false'}
                  aria-describedby={touched.phone && errors.phone ? 'phone-error' : undefined}
                  className={`mt-1 block w-full px-4 py-2.5 border rounded-md shadow-sm focus:outline-none focus:ring-2 sm:text-sm transition-shadow text-white placeholder-gray-400 bg-neutral-darker ${
                    touched.phone && errors.phone
                      ? 'border-danger focus:ring-danger focus:border-danger'
                      : touched.phone && !errors.phone && phone
                      ? 'border-success focus:ring-primary focus:border-primary'
                      : 'border-neutral focus:ring-primary focus:border-primary'
                  }`}
                  placeholder="(555) 123-4567"
                  maxLength={17}
                />
                {touched.phone && !errors.phone && phone && (
                  <CheckCircleIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-success" aria-hidden="true" />
                )}
                {touched.phone && errors.phone && (
                  <XCircleIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-danger" aria-hidden="true" />
                )}
              </div>
              {touched.phone && errors.phone && (
                <p id="phone-error" className="mt-1 text-sm text-danger" role="alert">
                  {errors.phone}
                </p>
              )}
            </div>
          )}

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-neutral-dark mb-1">
              Password <span className="text-danger" aria-label="required">*</span>
              {!isLogin && password && (
                <span className={`ml-2 text-xs font-normal ${passwordStrength?.color}`}>
                  ({passwordStrength?.text})
                </span>
              )}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={password}
                onChange={handlePasswordChange}
                onBlur={() => handleBlur('password')}
                required={!isLogin}
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                aria-required="true"
                aria-invalid={touched.password && errors.password ? 'true' : 'false'}
                aria-describedby={touched.password && errors.password ? 'password-error' : undefined}
                className={`mt-1 block w-full px-4 py-2.5 pr-12 border rounded-md shadow-sm focus:outline-none focus:ring-2 sm:text-sm transition-shadow text-white placeholder-gray-400 bg-neutral-darker ${
                  touched.password && errors.password
                    ? 'border-danger focus:ring-danger focus:border-danger'
                    : touched.password && !errors.password && password
                    ? 'border-success focus:ring-primary focus:border-primary'
                    : 'border-neutral focus:ring-primary focus:border-primary'
                }`}
                placeholder={isLogin ? 'Enter your password' : 'Create a password'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 px-3 flex items-center text-neutral-dark hover:text-primary focus:outline-none focus:text-primary"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                tabIndex={0}
              >
                {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
              </button>
            </div>
            {touched.password && errors.password && (
              <p id="password-error" className="mt-1 text-sm text-danger" role="alert">
                {errors.password}
              </p>
            )}
            {!isLogin && password && !errors.password && (
              <div className="mt-2">
                <div className="flex items-center space-x-2 text-xs text-neutral-dark">
                  <span className={password.length >= 6 ? 'text-success' : 'text-neutral'}>✓ At least 6 characters</span>
                  <span className={/[a-zA-Z]/.test(password) ? 'text-success' : 'text-neutral'}>✓ Contains letters</span>
                  <span className={/[0-9]/.test(password) ? 'text-success' : 'text-neutral'}>✓ Contains numbers</span>
                </div>
              </div>
            )}
          </div>

          {/* API Error Display */}
          {apiError && (
            <div className="bg-danger/10 border border-danger rounded-md p-4" role="alert" aria-live="polite">
              <div className="flex items-start">
                <XCircleIcon className="w-5 h-5 text-danger flex-shrink-0 mt-0.5 mr-2" aria-hidden="true" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-danger">{apiError}</p>
                  {networkError && (
                    <p className="text-xs text-neutral-dark mt-1">
                      If the problem persists, please check your internet connection or contact support.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Network Error Display */}
          {networkError && !apiError && (
            <div className="bg-warning/10 border border-warning rounded-md p-4" role="alert" aria-live="polite">
              <div className="flex items-start">
                <ExclamationCircleIcon className="w-5 h-5 text-warning flex-shrink-0 mt-0.5 mr-2" aria-hidden="true" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-warning">
                    Connection problem detected
                  </p>
                  <p className="text-xs text-neutral-dark mt-1">
                    Please check your internet connection and try again.
                  </p>
                  {retryCount < 3 && (
                    <button
                      type="button"
                      onClick={() => {
                        setRetryCount((prev: number) => prev + 1);
                        setNetworkError(false);
                        setApiError(null);
                        handleSubmit(); // Retry submission
                      }}
                      className="mt-2 text-xs text-primary hover:underline font-medium"
                    >
                      Retry connection
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || isSubmitting || !isFormValid}
            className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-lg text-base font-medium text-white bg-secondary hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary transition-all duration-150 ease-in-out disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:bg-secondary relative group"
            aria-busy={isLoading || isSubmitting}
            aria-describedby={disabledReason ? "submit-help" : undefined}
            title={disabledReason || undefined}
          >
            {isLoading || isSubmitting ? (
              <>
                <LoadingSpinner size="sm" />
                <span className="ml-2">{isLogin ? 'Logging in...' : 'Creating account...'}</span>
              </>
            ) : (
              isLogin ? 'Login' : 'Sign Up'
            )}
          </button>
          
          {/* Show reason why button is disabled */}
          {disabledReason && !isLoading && !isSubmitting && (
            <div 
              id="submit-help"
              className="mt-2 text-center"
              role="status"
              aria-live="polite"
            >
              <p className="text-xs text-neutral-dark flex items-center justify-center space-x-1">
                <ExclamationCircleIcon className="w-4 h-4 text-warning flex-shrink-0" aria-hidden="true" />
                <span>{disabledReason}</span>
              </p>
            </div>
          )}
        </form>

        <p className="mt-8 text-center text-sm text-neutral-dark">
          {isLogin ? "Don't have an account?" : 'Already have an account?'}
          <button
            type="button"
            onClick={handleToggleMode}
            className="font-medium text-primary hover:text-blue-700 ml-1 focus:outline-none focus:underline"
            aria-label={isLogin ? 'Switch to sign up' : 'Switch to login'}
          >
            {isLogin ? 'Sign Up Now' : 'Login Here'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default AuthPage;
