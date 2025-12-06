import { User, Property, Message, UserType, PropertyTypeEnum, PropertyApplication, ApplicationStatus } from './types';
import { MOCK_USERS_KEY, MOCK_PROPERTIES_KEY, MOCK_MESSAGES_KEY, MOCK_APPLICATIONS_KEY } from './constants';

// A sample base64 image (tiny transparent PNG)
const sampleBase64Image = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

const initialUsers: User[] = [
  {
    id: 'user-landlord-1',
    userType: UserType.Landlord,
    name: 'Alice Wonderland',
    email: 'alice@example.com',
    phone: '555-1234',
    profilePicture: 'https://picsum.photos/seed/alice/200',
    idVerified: true,
    employmentDetails: 'Property Manager',
    favoriteProperties: [],
  },
  {
    id: 'user-tenant-1',
    userType: UserType.Tenant,
    name: 'Bob The Renter',
    email: 'bob@example.com',
    phone: '555-5678',
    profilePicture: 'https://picsum.photos/seed/bob/200',
    idVerified: true,
    employmentDetails: 'Software Developer at TechCorp',
    favoriteProperties: ['prop-2'],
  },
  {
    id: 'user-landlord-2',
    userType: UserType.Landlord,
    name: 'Charlie Brown',
    email: 'charlie@example.com',
    phone: '555-8765',
    profilePicture: 'https://picsum.photos/seed/charlie/200',
    idVerified: true,
    employmentDetails: 'Independent Owner',
    favoriteProperties: [],
  },
   {
    id: 'user-tenant-2',
    userType: UserType.Tenant,
    name: 'Diana Prince',
    email: 'diana@example.com',
    phone: '555-0011',
    profilePicture: 'https://picsum.photos/seed/diana/200',
    idVerified: false,
    employmentDetails: 'Curator at Museum',
    favoriteProperties: ['prop-1', 'prop-3'],
  },
];

const initialProperties: Property[] = [
  {
    id: 'prop-1',
    landlordId: 'user-landlord-1',
    title: 'Cozy Downtown Apartment',
    description: 'A beautiful and cozy apartment in the heart of the city. Close to all amenities, shops, and restaurants. Perfect for young professionals or couples. Recently renovated with hardwood floors and stainless steel appliances. Address: 123 Main St, Metropolis.',
    photos: ['https://picsum.photos/seed/prop1_1/600/400', 'https://picsum.photos/seed/prop1_2/600/400', sampleBase64Image],
    price: 1250,
    propertyType: PropertyTypeEnum.Apartment,
    address: '123 Main St, Apt 4B',
    city: 'Metropolis',
    zipCode: '12345',
    latitude: 34.0522, // Example coords for Metropolis (LA)
    longitude: -118.2437,
    availabilityDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days from now
    tenantRequirements: 'Minimum 1-year lease. No pets. Credit check required. Proof of income (3x rent).',
  },
  {
    id: 'prop-2',
    landlordId: 'user-landlord-1',
    title: 'Spacious Suburban House with Yard',
    description: 'Large family house with a big fenced yard in a quiet suburban neighborhood. Great schools nearby. Features 3 bedrooms, 2.5 bathrooms, a modern kitchen with granite countertops, and a two-car garage. Located at 456 Oak Avenue, Suburbia.',
    photos: [sampleBase64Image, 'https://picsum.photos/seed/prop2_2/600/400', 'https://picsum.photos/seed/prop2_3/600/400'],
    price: 2600,
    propertyType: PropertyTypeEnum.House,
    address: '456 Oak Avenue',
    city: 'Suburbia',
    zipCode: '67890',
    latitude: 33.9533, // Example coords for Suburbia
    longitude: -118.3964,
    availabilityDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
    tenantRequirements: 'Families preferred. Pets negotiable with deposit. Good references needed. Lawn care included.',
  },
  {
    id: 'prop-3',
    landlordId: 'user-landlord-2',
    title: 'Modern Condo with Stunning City Views',
    description: 'Sleek and modern 2-bedroom, 2-bathroom condo on a high floor with stunning panoramic city views. Building amenities include a gym, rooftop terrace with BBQ, and 24/7 concierge. Secure underground parking available. Unit 1502 at 789 Highrise Blvd, Metropolis.',
    photos: ['https://picsum.photos/seed/prop3_1/600/400', 'https://picsum.photos/seed/prop3_2/600/400'],
    price: 1950,
    propertyType: PropertyTypeEnum.Condo,
    address: '789 Highrise Blvd, Unit 1502',
    city: 'Metropolis',
    zipCode: '12347',
    latitude: 34.0550,
    longitude: -118.2500,
    availabilityDate: new Date().toISOString(), // Available now
    tenantRequirements: 'Professional tenants. No smoking building. 12 or 18-month lease option. Subject to HOA rules.',
  },
];

const initialMessages: Message[] = [
    {
        id: 'msg-1',
        senderId: 'user-tenant-1',
        receiverId: 'user-landlord-1',
        propertyId: 'prop-1',
        subject: 'Inquiry about Cozy Downtown Apartment',
        content: 'Hello Alice, I am very interested in the Cozy Downtown Apartment. Is it still available? I would love to schedule a viewing as soon as possible. My employment details are up to date on my profile. Thanks, Bob.',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        isRead: false,
    },
    {
        id: 'msg-2',
        senderId: 'user-landlord-1',
        receiverId: 'user-tenant-1',
        propertyId: 'prop-1',
        subject: 'Re: Inquiry about Cozy Downtown Apartment',
        content: 'Hi Bob, thanks for your interest! Yes, it is still available. I can do a viewing tomorrow at 3 PM or Wednesday at 5 PM. Let me know if either of those times work for you. Please also consider submitting an application through the platform if you are serious. Regards, Alice.',
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        isRead: true,
    }
];

const initialApplications: PropertyApplication[] = [
    {
        id: 'app-1',
        propertyId: 'prop-1',
        tenantId: 'user-tenant-1',
        landlordId: 'user-landlord-1',
        applicationDate: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(), // 20 hours ago
        status: ApplicationStatus.Pending,
        messageToLandlord: 'I am very interested in this property and meet all requirements. Available to move in soon.'
    },
    {
        id: 'app-2',
        propertyId: 'prop-3',
        tenantId: 'user-tenant-2',
        landlordId: 'user-landlord-2',
        applicationDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        status: ApplicationStatus.ViewScheduled,
        messageToLandlord: 'This condo looks perfect! I\'d like to apply formally.'
    }
];


const getFromLocalStorage = <T,>(key: string, defaultValue: T): T => {
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.warn(`Error reading localStorage key "${key}":`, error);
    return defaultValue;
  }
};

const saveToLocalStorage = <T,>(key: string, value: T): void => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`Error setting localStorage key "${key}":`, error);
  }
};

export const loadUsers = (): User[] => getFromLocalStorage(MOCK_USERS_KEY, initialUsers);
export const saveUsers = (users: User[]): void => saveToLocalStorage(MOCK_USERS_KEY, users);

export const loadProperties = (): Property[] => getFromLocalStorage(MOCK_PROPERTIES_KEY, initialProperties);
export const saveProperties = (properties: Property[]): void => saveToLocalStorage(MOCK_PROPERTIES_KEY, properties);

export const loadMessages = (): Message[] => getFromLocalStorage(MOCK_MESSAGES_KEY, initialMessages);
export const saveMessages = (messages: Message[]): void => saveToLocalStorage(MOCK_MESSAGES_KEY, messages);

export const loadApplications = (): PropertyApplication[] => getFromLocalStorage(MOCK_APPLICATIONS_KEY, initialApplications);
export const saveApplications = (applications: PropertyApplication[]): void => saveToLocalStorage(MOCK_APPLICATIONS_KEY, applications);


// Initialize if not present
if (!localStorage.getItem(MOCK_USERS_KEY)) {
  saveUsers(initialUsers);
}
if (!localStorage.getItem(MOCK_PROPERTIES_KEY)) {
  saveProperties(initialProperties);
}
if (!localStorage.getItem(MOCK_MESSAGES_KEY)) {
  saveMessages(initialMessages);
}
if(!localStorage.getItem(MOCK_APPLICATIONS_KEY)) {
  saveApplications(initialApplications);
}