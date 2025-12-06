export enum UserType {
  Tenant = 'Tenant',
  Landlord = 'Landlord',
}

export enum PropertyTypeEnum {
  Apartment = 'Apartment',
  House = 'House',
  Condo = 'Condo',
  Townhouse = 'Townhouse',
  Room = 'Room',
}

export interface User {
  id: string; // Will be _id from MongoDB
  userType: UserType;
  name: string;
  email: string;
  phone: string;
  profilePicture: string; // URL
  idVerified: boolean; // Simplified
  employmentDetails: string; // For tenants
  favoriteProperties: string[]; // Array of property IDs
  // token?: string; // JWT token, might be stored separately or with user in context
}

export type Amenity = 'parking' | 'laundry' | 'pet-friendly' | 'furnished' | 'air-conditioning' | 'heating' | 'wifi' | 'dishwasher' | 'gym' | 'pool' | 'balcony' | 'garden' | 'elevator' | 'security' | 'storage';

export type PetPolicy = 'no-pets' | 'cats-only' | 'dogs-only' | 'small-pets-only' | 'all-pets-allowed' | 'case-by-case';

export type LeaseTerm = 'month-to-month' | '3-months' | '6-months' | '12-months' | '18-months' | '24-months' | 'flexible';

export interface Property {
  id: string; // Will be _id from MongoDB
  landlordId: string | User; // Can be populated with User object
  title: string;
  description: string;
  photos: string[]; // URLs or base64 Data URLs (backend should handle storage)
  price: number;
  propertyType: PropertyTypeEnum;
  address: string;
  city: string;
  zipCode: string;
  latitude?: number;
  longitude?: number;
  availabilityDate: string; // ISO date string
  tenantRequirements: string;
  bedrooms?: number;
  bathrooms?: number;
  amenities?: Amenity[];
  squareFootage?: number;
  petPolicy?: PetPolicy;
  leaseTerms?: LeaseTerm[];
  createdAt?: string; // From Mongoose timestamps
  updatedAt?: string; // From Mongoose timestamps
}

export interface Message {
  id: string; // Will be _id from MongoDB
  senderId: string | User;
  receiverId: string | User;
  propertyId?: string | Property;
  subject?: string;
  content: string;
  timestamp: string; // Will be createdAt from Mongoose
  isRead: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export enum ApplicationStatus {
  Pending = 'Pending',
  ViewScheduled = 'View Scheduled',
  UnderReview = 'Under Review',
  Accepted = 'Accepted',
  Rejected = 'Rejected',
}

export interface PropertyApplication {
  id: string; // Will be _id from MongoDB
  propertyId: string | Property;
  tenantId: string | User;
  landlordId: string | User;
  applicationDate: string; // Will be createdAt from Mongoose
  status: ApplicationStatus;
  messageToLandlord?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Review {
  id: string; // Will be _id from MongoDB
  reviewerId: string | User;
  revieweeId: string | User;
  propertyId?: string | Property;
  rating: number; // 1-5
  title?: string;
  content: string;
  isModerated: boolean;
  isApproved: boolean;
  moderatedBy?: string | User;
  moderatedAt?: string;
  moderationNotes?: string;
  isFlagged: boolean;
  flaggedBy?: string[];
  response?: {
    content: string;
    respondedAt: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

export interface SavedSearch {
  id: string;
  userId: string;
  name: string;
  searchCriteria: {
    q?: string;
    loc?: string;
    minPrice?: string;
    maxPrice?: string;
    type?: string;
    bedrooms?: string;
    bathrooms?: string;
    amenities?: string[];
    radius?: string;
    lat?: string;
    lng?: string;
  };
  emailAlerts: boolean;
  lastChecked?: string;
  lastMatchCount?: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

export type DashboardTab =
  | 'profile'
  | 'messages'
  | 'listings'
  | 'applications_received'
  | 'favorites'
  | 'my_applications'
  | 'reviews_moderation';


// For API responses that include a token with user data
export interface AuthResponse extends User {
  token: string;
}

export interface AppContextType {
  currentUser: User | null;
  authToken: string | null; // Store JWT token
  properties: Property[];
  messages: Message[];
  applications: PropertyApplication[];
  reviews: Review[];
  login: (email: string, password_mock: string, userType: UserType) => Promise<void>; // password_mock renamed to password
  logout: () => void;
  signup: (userData: Omit<User, 'id' | 'favoriteProperties' | 'idVerified'> & {password: string}) => Promise<void>;
  addProperty: (propertyData: Omit<Property, 'id' | 'landlordId'>) => Promise<void>;
  updateProperty: (propertyData: Property) => Promise<void>;
  deleteProperty: (propertyId: string) => Promise<void>;
  sendMessage: (messageData: Omit<Message, 'id' | 'timestamp' | 'isRead' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  markMessageAsRead: (messageId: string) => Promise<void>;
  toggleFavorite: (propertyId: string) => Promise<void>;
  getLandlordById: (landlordId: string) => User | undefined; // This might change if users aren't all loaded upfront
  getUserById: (userId: string) => User | undefined; // This might change
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
  fetchProperties: () => Promise<void>; // Renamed from getPropertyById to reflect fetching all
  getPropertyById: (propertyId: string) => Property | undefined; // To get from current state
  submitApplication: (applicationData: Omit<PropertyApplication, 'id' | 'applicationDate' | 'status' | 'landlordId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateApplicationStatus: (applicationId: string, status: ApplicationStatus) => Promise<void>;
  getApplicationByPropertyAndTenant: (propertyId: string, tenantId: string) => PropertyApplication | undefined;
  fetchCurrentUser: () => Promise<void>; // To fetch user data if token exists
  submitReview: (reviewData: Omit<Review, 'id' | 'isModerated' | 'isApproved' | 'isFlagged' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  fetchReviews: (filters?: { revieweeId?: string; propertyId?: string; reviewerId?: string; approvedOnly?: boolean }) => Promise<void>;
  getReviewsByReviewee: (revieweeId: string) => Review[];
  getReviewsByProperty: (propertyId: string) => Review[];
  getReviewStats: (type: 'user' | 'property', id: string) => Promise<ReviewStats>;
  updateReview: (reviewId: string, reviewData: Partial<Review>) => Promise<void>;
  deleteReview: (reviewId: string) => Promise<void>;
  moderateReview: (reviewId: string, isApproved: boolean, moderationNotes?: string) => Promise<void>;
  respondToReview: (reviewId: string, response: string) => Promise<void>;
}

export interface ToastContextType {
  toasts: ToastMessage[];
  addToast: (message: string, type?: ToastType) => void;
}
