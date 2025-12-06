import { PropertyTypeEnum, ApplicationStatus } from './types';

export const APP_NAME = "LocalRent";
// Use environment variable for API URL, fallback to localhost for development
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';
export const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL || 'http://localhost:5174';

// Debug: Always log the API URL being used (helps troubleshoot deployment issues)
console.log('🔧 API Configuration:', {
  'VITE_API_BASE_URL from env': import.meta.env.VITE_API_BASE_URL || 'NOT SET',
  'Using API_BASE_URL': API_BASE_URL,
  'Is Production': import.meta.env.PROD,
  'Is Development': import.meta.env.DEV,
  'All env vars starting with VITE_': Object.keys(import.meta.env).filter(key => key.startsWith('VITE_'))
});

if (import.meta.env.PROD && !import.meta.env.VITE_API_BASE_URL) {
  console.error('❌ ERROR: VITE_API_BASE_URL is not set in production!');
  console.error('Please set VITE_API_BASE_URL in Vercel environment variables.');
  console.error('Expected: https://rentproperty-backend.onrender.com/api');
}

export const PROPERTY_TYPES_OPTIONS = [
  { value: PropertyTypeEnum.Apartment, label: 'Apartment' },
  { value: PropertyTypeEnum.House, label: 'House' },
  { value: PropertyTypeEnum.Condo, label: 'Condo' },
  { value: PropertyTypeEnum.Townhouse, label: 'Townhouse' },
  { value: PropertyTypeEnum.Room, label: 'Room' },
];

export const APPLICATION_STATUS_OPTIONS = [
  { value: ApplicationStatus.Pending, label: 'Pending' },
  { value: ApplicationStatus.ViewScheduled, label: 'View Scheduled' },
  { value: ApplicationStatus.UnderReview, label: 'Under Review' },
  { value: ApplicationStatus.Accepted, label: 'Accepted' },
  { value: ApplicationStatus.Rejected, label: 'Rejected' },
];

export const MOCK_USERS_KEY = 'localRentUsers';
export const MOCK_PROPERTIES_KEY = 'localRentProperties';
export const MOCK_MESSAGES_KEY = 'localRentMessages';
export const MOCK_APPLICATIONS_KEY = 'localRentApplications';
export const CURRENT_USER_KEY = 'localRentCurrentUser';
export const AUTH_TOKEN_KEY = 'localRentAuthToken'; // For storing JWT token
