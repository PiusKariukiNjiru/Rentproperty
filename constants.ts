import { PropertyTypeEnum, ApplicationStatus } from './types';

export const APP_NAME = "LocalRent";
// Use environment variable for API URL, fallback to localhost for development
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';
export const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL || 'http://localhost:5174';

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
