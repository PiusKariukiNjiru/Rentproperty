
import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User, Property, Message, AppContextType, UserType, PropertyApplication, ApplicationStatus, AuthResponse, Review, ReviewStats } from '../types';
// Removed direct data imports: loadUsers, saveUsers, loadProperties, etc.
import { CURRENT_USER_KEY, AUTH_TOKEN_KEY, API_BASE_URL } from '../constants';
import { useToast } from './ToastContext';

export const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

// Simple cache for properties
const propertyCache = new Map<string, { data: Property[]; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const { addToast } = useToast();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(() => localStorage.getItem(AUTH_TOKEN_KEY));
  const [properties, setProperties] = useState<Property[]>([]);
  const [messages, setMessages] = useState<Message[]>([]); // To be implemented with backend
  const [applications, setApplications] = useState<PropertyApplication[]>([]); // To be implemented with backend
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Effect to fetch current user if token exists
  useEffect(() => {
    const storedUser = localStorage.getItem(CURRENT_USER_KEY);
    if (storedUser) {
        setCurrentUser(JSON.parse(storedUser));
    }
    // If a token exists but no user data, try to fetch user data (e.g., on app load/refresh)
    // This part is crucial for persistent login across sessions using the token.
    if (authToken && !currentUser) {
        fetchCurrentUser();
    }
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authToken]); // Removed currentUser from dependency array to avoid loop, fetchCurrentUser handles setting user

  const fetchCurrentUser = useCallback(async () => {
    if (!authToken) return;
    setIsLoading(true);
    try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (!response.ok) {
            if (response.status === 401) { // Unauthorized or token expired
                // Clear token and user without calling logout to avoid circular dependency
                setCurrentUser(null);
                setAuthToken(null);
                localStorage.removeItem(CURRENT_USER_KEY);
                localStorage.removeItem(AUTH_TOKEN_KEY);
                addToast('Session expired. Please log in again.', 'warning');
            } else {
                throw new Error('Failed to fetch user data');
            }
            return;
        }
        const userData: User = await response.json();
        setCurrentUser(userData);
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userData));
    } catch (error) {
        console.error("Fetch current user error:", error);
        // Don't show error toast for automatic session restore failures, but clear session
        setCurrentUser(null);
        setAuthToken(null);
        localStorage.removeItem(CURRENT_USER_KEY);
        localStorage.removeItem(AUTH_TOKEN_KEY);
    } finally {
        setIsLoading(false);
    }
  }, [authToken, addToast]);

  const logout = useCallback(() => {
    setCurrentUser(null);
    setAuthToken(null);
    localStorage.removeItem(CURRENT_USER_KEY);
    localStorage.removeItem(AUTH_TOKEN_KEY);
    setProperties([]); // Clear properties on logout
    setMessages([]);   // Clear messages
    setApplications([]); // Clear applications
    addToast('You have been logged out.', 'info');
  }, [addToast]);

  const fetchProperties = useCallback(async (queryParams: Record<string, string> = {}) => {
    // Check cache first
    const cacheKey = JSON.stringify(queryParams);
    const cached = propertyCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      setProperties(cached.data);
      return;
    }
    
    setIsLoading(true);
    try {
        const queryString = new URLSearchParams(queryParams).toString();
        const response = await fetch(`${API_BASE_URL}/properties?${queryString}`);
        if (!response.ok) throw new Error('Failed to fetch properties');
        const data: Property[] = await response.json();
        setProperties(data);
        
        // Update cache
        propertyCache.set(cacheKey, { data, timestamp: Date.now() });
    } catch (error: any) {
        addToast(error.message || 'Could not load properties.', 'error');
        console.error("Fetch properties error:", error);
    } finally {
        setIsLoading(false);
    }
  }, [addToast]);

  const fetchMessages = useCallback(async () => {
    if (!authToken) return;
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/messages`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (!response.ok) {
        if (response.status === 401) {
          logout();
          return;
        }
        throw new Error('Failed to fetch messages');
      }
      const data: Message[] = await response.json();
      setMessages(data);
    } catch (error: any) {
      console.error("Fetch messages error:", error);
      // Don't show error toast for automatic fetches
    } finally {
      setIsLoading(false);
    }
  }, [authToken, logout]);

  const fetchApplications = useCallback(async () => {
    if (!authToken) return;
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/applications`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (!response.ok) {
        if (response.status === 401) {
          logout();
          return;
        }
        throw new Error('Failed to fetch applications');
      }
      const data: PropertyApplication[] = await response.json();
      setApplications(data);
    } catch (error: any) {
      console.error("Fetch applications error:", error);
      // Don't show error toast for automatic fetches
    } finally {
      setIsLoading(false);
    }
  }, [authToken, logout]);

  const login = useCallback(async (email: string, password_mock: string, userType: UserType) => {
    setIsLoading(true);
    try {
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: password_mock, userType }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      let data: AuthResponse | { errors: {msg: string}[] } | {msg: string};

      if (contentType && contentType.includes('application/json')) {
        try {
          data = await response.json();
        } catch (parseError) {
          throw new Error('Invalid response from server. Please try again.');
        }
      } else {
        const text = await response.text();
        throw new Error(text || 'Login failed');
      }

      if (!response.ok) {
        if ('errors' in data && Array.isArray(data.errors)) {
            const errorMessages = data.errors.map((e: {msg: string}) => e.msg).join(', ');
            throw new Error(errorMessages);
        }
        throw new Error((data as any).msg || `Login failed (${response.status})`);
      }
      
      const authData = data as AuthResponse;
      setCurrentUser(authData); // Backend returns full user object including id
      setAuthToken(authData.token);
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(authData));
      localStorage.setItem(AUTH_TOKEN_KEY, authData.token);
      addToast(`Welcome back, ${authData.name}!`, 'success');
      // After login, fetch initial data relevant to the user
      await fetchProperties();
      await fetchMessages(); 
      await fetchApplications();

    } catch (error: any) {
      // Re-throw error to be handled by the component
      if (error.name === 'AbortError') {
        throw new Error('Request timed out. Please check your connection and try again.');
      } else if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new Error('Network error. Please check your internet connection.');
      } else {
        throw error; // Re-throw to be handled by AuthPage
      }
    } finally {
      setIsLoading(false);
    }
  }, [addToast, fetchProperties, fetchMessages, fetchApplications]);

  const signup = useCallback(async (userDataWithPassword: Omit<User, 'id' | 'favoriteProperties' | 'idVerified'> & {password: string}) => {
    setIsLoading(true);
    const { password, ...signupData } = userDataWithPassword;
    try {
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...signupData, password }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      let data: AuthResponse | { errors: {msg: string}[] } | {msg: string};

      if (contentType && contentType.includes('application/json')) {
        try {
          data = await response.json();
        } catch (parseError) {
          throw new Error('Invalid response from server. Please try again.');
        }
      } else {
        const text = await response.text();
        throw new Error(text || 'Signup failed');
      }

      if (!response.ok) {
         if ('errors' in data && Array.isArray(data.errors)) {
            const errorMessages = data.errors.map((e: {msg: string}) => e.msg).join(', ');
            throw new Error(errorMessages);
        }
        throw new Error((data as any).msg || `Signup failed (${response.status})`);
      }
      
      const authData = data as AuthResponse;
      setCurrentUser(authData); // Backend returns user object with _id as id
      setAuthToken(authData.token);
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(authData));
      localStorage.setItem(AUTH_TOKEN_KEY, authData.token);
      addToast('Account created successfully! Welcome!', 'success');
       // After signup, fetch initial data
      await fetchProperties();
      await fetchMessages(); 
      await fetchApplications();

    } catch (error: any) {
      // Re-throw error to be handled by the component
      if (error.name === 'AbortError') {
        throw new Error('Request timed out. Please check your connection and try again.');
      } else if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new Error('Network error. Please check your internet connection.');
      } else {
        throw error; // Re-throw to be handled by AuthPage
      }
    } finally {
      setIsLoading(false);
    }
  }, [addToast, fetchProperties, fetchMessages, fetchApplications]);

  useEffect(() => { // Initial fetch of properties on component mount
    fetchProperties();
    if (authToken) {
      fetchMessages();
      fetchApplications();
    }
  }, [fetchProperties, authToken, fetchMessages, fetchApplications]);


  const addProperty = useCallback(async (propertyData: Omit<Property, 'id' | 'landlordId'>) => {
    if (!currentUser || currentUser.userType !== UserType.Landlord || !authToken) {
      addToast('Only authenticated landlords can add properties.', 'error');
      return Promise.reject(new Error('User is not an authenticated landlord'));
    }
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/properties`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(propertyData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.errors ? errorData.errors.map((e: any) => e.msg).join(', ') : (errorData.msg || 'Failed to add property'));
      }
      const newProperty: Property = await response.json();
      setProperties(prev => [...prev, newProperty]);
      addToast('Property listed successfully!', 'success');
    } catch (error: any) {
      addToast(error.message || 'Error adding property.', 'error');
      console.error("Add property error:", error);
      throw error; // Re-throw to allow form to handle its state
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, authToken, addToast]);

  const updateProperty = useCallback(async (propertyData: Property) => {
     if (!currentUser || currentUser.userType !== UserType.Landlord || !authToken) {
      addToast('Only authenticated landlords can update properties.', 'error');
      return Promise.reject(new Error('User is not an authenticated landlord'));
    }
    if (propertyData.landlordId !== currentUser.id && (typeof propertyData.landlordId === 'string' && (propertyData.landlordId as any)._id !== currentUser.id)) {
        addToast('You can only update your own properties.', 'error');
        return Promise.reject(new Error('User does not own this property.'));
    }
    setIsLoading(true);
    try {
        const response = await fetch(`${API_BASE_URL}/properties/${propertyData.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
            },
            body: JSON.stringify(propertyData),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.errors ? errorData.errors.map((e: any) => e.msg).join(', ') : (errorData.msg ||'Failed to update property'));
        }
        const updatedProp: Property = await response.json();
        setProperties(prev => prev.map(p => p.id === updatedProp.id ? updatedProp : p));
        addToast('Property updated successfully!', 'success');
    } catch (error: any) {
        addToast(error.message || 'Error updating property.', 'error');
        console.error("Update property error:", error);
        throw error;
    } finally {
        setIsLoading(false);
    }
  }, [currentUser, authToken, addToast]);

  const deleteProperty = useCallback(async (propertyId: string) => {
    if (!currentUser || currentUser.userType !== UserType.Landlord || !authToken) {
      addToast('Only authenticated landlords can delete properties.', 'error');
      return Promise.reject(new Error('User is not an authenticated landlord'));
    }
    setIsLoading(true);
    try {
        const response = await fetch(`${API_BASE_URL}/properties/${propertyId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` },
        });
        if (!response.ok) {
             const errorData = await response.json();
            throw new Error(errorData.msg || 'Failed to delete property');
        }
        setProperties(prev => prev.filter(p => p.id !== propertyId));
        addToast('Property deleted successfully.', 'success');
    } catch (error: any) {
        addToast(error.message || 'Error deleting property.', 'error');
        console.error("Delete property error:", error);
        throw error;
    } finally {
        setIsLoading(false);
    }
  }, [currentUser, authToken, addToast]);
  
  const toggleFavorite = useCallback(async (propertyId: string) => {
    if (!currentUser || currentUser.userType !== UserType.Tenant || !authToken) {
      addToast('Login as a tenant to favorite properties.', 'warning');
      return Promise.reject(new Error('User not a tenant or not logged in.'));
    }
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/properties/${propertyId}/favorite`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${authToken}` },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.msg || 'Failed to update favorites');
      }
      const data: { favoriteProperties: string[] } = await response.json();
      
      // Update currentUser in context and localStorage
      const updatedUser = { ...currentUser, favoriteProperties: data.favoriteProperties };
      setCurrentUser(updatedUser);
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser));

      const isNowFavorite = data.favoriteProperties.includes(propertyId);
      addToast(isNowFavorite ? 'Added to favorites!' : 'Removed from favorites.', 'success');

    } catch (error: any) {
      addToast(error.message || 'Error updating favorites.', 'error');
      console.error("Toggle favorite error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, authToken, addToast]);


  // --- Messages implementation with backend API calls ---
  const sendMessage = useCallback(async (messageData: Omit<Message, 'id' | 'timestamp' | 'isRead' | 'createdAt' | 'updatedAt'>) => {
    if (!authToken) {
      addToast('Please log in to send messages.', 'error');
      return Promise.reject(new Error('Not authenticated'));
    }
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(messageData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.errors ? errorData.errors.map((e: any) => e.msg).join(', ') : (errorData.msg || 'Failed to send message'));
      }
      const newMessage: Message = await response.json();
      setMessages(prev => [newMessage, ...prev]);
      addToast('Message sent successfully!', 'success');
    } catch (error: any) {
      addToast(error.message || 'Error sending message.', 'error');
      console.error("Send message error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [authToken, addToast]);

  const markMessageAsRead = useCallback(async (messageId: string) => {
    if (!authToken) {
      return Promise.reject(new Error('Not authenticated'));
    }
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/messages/${messageId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.msg || 'Failed to mark message as read');
      }
      const updatedMessage: Message = await response.json();
      setMessages(prev => prev.map(m => m.id === updatedMessage.id ? updatedMessage : m));
    } catch (error: any) {
      addToast(error.message || 'Error updating message.', 'error');
      console.error("Mark message as read error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [authToken, addToast]);

  const getLandlordById = useCallback((landlordId: string): User | undefined => {
    // If it's the current user, return immediately
    if (currentUser?.id === landlordId) {
      return currentUser;
    }
    // Try to find from populated property data
    const property = properties.find(p => {
      const lid = typeof p.landlordId === 'string' ? p.landlordId : p.landlordId.id;
      return lid === landlordId;
    });
    if (property && typeof property.landlordId === 'object') {
      return property.landlordId as User;
    }
    return undefined;
  }, [currentUser, properties]);

  const getUserById = useCallback((userId: string): User | undefined => {
    // If it's the current user, return immediately
    if (currentUser?.id === userId) {
      return currentUser;
    }
    // Try to find from populated property data
    const property = properties.find(p => {
      const lid = typeof p.landlordId === 'string' ? p.landlordId : p.landlordId.id;
      return lid === userId;
    });
    if (property && typeof property.landlordId === 'object') {
      return property.landlordId as User;
    }
    return undefined;
  }, [currentUser, properties]);

  const getPropertyById = useCallback((propertyId: string): Property | undefined => {
    return properties.find(p => p.id === propertyId);
  }, [properties]);

  const submitApplication = useCallback(async (appData: Omit<PropertyApplication, 'id'|'applicationDate'|'status'|'landlordId'|'createdAt'|'updatedAt'>) => {
    if (!currentUser || currentUser.userType !== UserType.Tenant || !authToken) {
      addToast('Only authenticated tenants can submit applications.', 'error');
      return Promise.reject(new Error('User is not an authenticated tenant'));
    }
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(appData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.errors ? errorData.errors.map((e: any) => e.msg).join(', ') : (errorData.msg || 'Failed to submit application'));
      }
      const newApplication: PropertyApplication = await response.json();
      setApplications(prev => [newApplication, ...prev]);
      addToast('Application submitted successfully!', 'success');
    } catch (error: any) {
      addToast(error.message || 'Error submitting application.', 'error');
      console.error("Submit application error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, authToken, addToast]);

  const updateApplicationStatus = useCallback(async (applicationId: string, status: ApplicationStatus) => {
    if (!currentUser || currentUser.userType !== UserType.Landlord || !authToken) {
      addToast('Only authenticated landlords can update application status.', 'error');
      return Promise.reject(new Error('User is not an authenticated landlord'));
    }
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/applications/${applicationId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.errors ? errorData.errors.map((e: any) => e.msg).join(', ') : (errorData.msg || 'Failed to update application status'));
      }
      const updatedApplication: PropertyApplication = await response.json();
      setApplications(prev => prev.map(app => app.id === updatedApplication.id ? updatedApplication : app));
      addToast('Application status updated successfully!', 'success');
    } catch (error: any) {
      addToast(error.message || 'Error updating application status.', 'error');
      console.error("Update application status error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, authToken, addToast]);

  const getApplicationByPropertyAndTenant = useCallback((propertyId: string, tenantId: string): PropertyApplication | undefined => {
    return applications.find(app => String(app.propertyId) === propertyId && String(app.tenantId) === tenantId);
  }, [applications]);

  // Review Functions
  const fetchReviews = useCallback(async (filters?: { revieweeId?: string; propertyId?: string; reviewerId?: string; approvedOnly?: boolean }) => {
    if (!authToken) return;
    // Don't set global loading - reviews fetching shouldn't block the entire UI
    try {
      const queryParams = new URLSearchParams();
      if (filters?.revieweeId) queryParams.append('revieweeId', filters.revieweeId);
      if (filters?.propertyId) queryParams.append('propertyId', filters.propertyId);
      if (filters?.reviewerId) queryParams.append('reviewerId', filters.reviewerId);
      // Default to fetching all reviews (approved and pending) unless explicitly set to approvedOnly
      if (filters?.approvedOnly !== undefined) {
        queryParams.append('approvedOnly', filters.approvedOnly.toString());
      }

      const response = await fetch(`${API_BASE_URL}/reviews?${queryParams.toString()}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (!response.ok) {
        if (response.status === 401) {
          logout();
          return;
        }
        throw new Error('Failed to fetch reviews');
      }
      const data: Review[] = await response.json();
      // Merge with existing reviews, updating existing ones and adding new ones
      setReviews(prev => {
        const reviewMap = new Map(prev.map(r => [r.id, r]));
        // Update or add reviews from the fetched data
        data.forEach(review => {
          reviewMap.set(review.id, review);
        });
        return Array.from(reviewMap.values());
      });
    } catch (error: any) {
      console.error("Fetch reviews error:", error);
      // Don't throw - just log the error
    }
  }, [authToken, logout]);

  const submitReview = useCallback(async (reviewData: Omit<Review, 'id' | 'isModerated' | 'isApproved' | 'isFlagged' | 'createdAt' | 'updatedAt'>) => {
    if (!authToken) {
      addToast('Please log in to submit a review', 'error');
      return Promise.reject(new Error('Not authenticated'));
    }
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(reviewData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.msg || errorData.errors?.[0]?.msg || 'Failed to submit review');
      }
      const newReview: Review = await response.json();
      setReviews(prev => [newReview, ...prev]);
      addToast('Review submitted successfully! It will be visible after moderation.', 'success');
    } catch (error: any) {
      addToast(error.message || 'Error submitting review.', 'error');
      console.error("Submit review error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [authToken, addToast]);

  const getReviewsByReviewee = useCallback((revieweeId: string): Review[] => {
    return reviews.filter(review => 
      String(review.revieweeId) === revieweeId && review.isApproved
    );
  }, [reviews]);

  const getReviewsByProperty = useCallback((propertyId: string): Review[] => {
    return reviews.filter(review => 
      review.propertyId && String(review.propertyId) === propertyId && review.isApproved
    );
  }, [reviews]);

  const getReviewStats = useCallback(async (type: 'user' | 'property', id: string): Promise<ReviewStats> => {
    if (!authToken) {
      return { averageRating: 0, totalReviews: 0, ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } };
    }
    try {
      const response = await fetch(`${API_BASE_URL}/reviews/stats/${type}/${id}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch review stats');
      }
      const stats: ReviewStats = await response.json();
      return stats;
    } catch (error: any) {
      console.error("Get review stats error:", error);
      return { averageRating: 0, totalReviews: 0, ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } };
    }
  }, [authToken]);

  const updateReview = useCallback(async (reviewId: string, reviewData: Partial<Review>) => {
    if (!authToken) {
      addToast('Please log in to update a review', 'error');
      return Promise.reject(new Error('Not authenticated'));
    }
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/reviews/${reviewId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(reviewData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.msg || 'Failed to update review');
      }
      const updatedReview: Review = await response.json();
      setReviews(prev => prev.map(review => review.id === reviewId ? updatedReview : review));
      addToast('Review updated successfully!', 'success');
    } catch (error: any) {
      addToast(error.message || 'Error updating review.', 'error');
      console.error("Update review error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [authToken, addToast]);

  const deleteReview = useCallback(async (reviewId: string) => {
    if (!authToken) {
      addToast('Please log in to delete a review', 'error');
      return Promise.reject(new Error('Not authenticated'));
    }
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.msg || 'Failed to delete review');
      }
      setReviews(prev => prev.filter(review => review.id !== reviewId));
      addToast('Review deleted successfully!', 'success');
    } catch (error: any) {
      addToast(error.message || 'Error deleting review.', 'error');
      console.error("Delete review error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [authToken, addToast]);

  const moderateReview = useCallback(async (reviewId: string, isApproved: boolean, moderationNotes?: string) => {
    if (!authToken) {
      addToast('Please log in to moderate reviews', 'error');
      return Promise.reject(new Error('Not authenticated'));
    }
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/reviews/${reviewId}/moderate`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ isApproved, moderationNotes }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.msg || 'Failed to moderate review');
      }
      const moderatedReview: Review = await response.json();
      setReviews(prev => {
        const exists = prev.some(r => r.id === reviewId);
        if (exists) {
          return prev.map(review => review.id === reviewId ? moderatedReview : review);
        }
        return [moderatedReview, ...prev];
      });
      addToast(`Review ${isApproved ? 'approved' : 'rejected'} successfully!`, 'success');
    } catch (error: any) {
      addToast(error.message || 'Error moderating review.', 'error');
      console.error("Moderate review error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [authToken, addToast]);

  const respondToReview = useCallback(async (reviewId: string, response: string) => {
    if (!authToken) {
      addToast('Please log in to respond to reviews', 'error');
      return Promise.reject(new Error('Not authenticated'));
    }
    setIsLoading(true);
    try {
      const apiResponse = await fetch(`${API_BASE_URL}/reviews/${reviewId}/respond`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ content: response }),
      });
      if (!apiResponse.ok) {
        const errorData = await apiResponse.json();
        throw new Error(errorData.msg || 'Failed to respond to review');
      }
      const updatedReview: Review = await apiResponse.json();
      setReviews(prev => {
        const exists = prev.some(r => r.id === reviewId);
        if (exists) {
          return prev.map(review => review.id === reviewId ? updatedReview : review);
        }
        return [updatedReview, ...prev];
      });
      addToast('Response added successfully!', 'success');
    } catch (error: any) {
      addToast(error.message || 'Error responding to review.', 'error');
      console.error("Respond to review error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [authToken, addToast]);

  // --- End of Placeholder/Mock implementations ---

  return (
    <AppContext.Provider value={{
      currentUser, authToken, properties, messages, applications, reviews,
      login, logout, signup,
      addProperty, updateProperty, deleteProperty,
      sendMessage, markMessageAsRead, toggleFavorite,
      getLandlordById, getUserById, isLoading, setLoading: setIsLoading, fetchProperties, getPropertyById,
      submitApplication, updateApplicationStatus, getApplicationByPropertyAndTenant,
      fetchCurrentUser,
      submitReview, fetchReviews, getReviewsByReviewee, getReviewsByProperty, getReviewStats,
      updateReview, deleteReview, moderateReview, respondToReview
    }}>
      {children}
    </AppContext.Provider>
  );
};
