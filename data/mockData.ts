import { User } from '../types';

export const MOCK_USER: User = {
    uid: 'rajesh_123',
    name: "Dr. Rajesh Koothrappali",
    email: "rajesh@dentkart.com",
    phone: "+91 98765 43210",
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    userType: 'dental-doctor',
    registrationDate: '2023-01-01',
    isVerified: true,
    verificationStatus: 'approved',
    dentalDoctorInfo: {
        licenseId: 'DENT-MH-2023-1234',
        licenseState: 'Maharashtra',
        specialization: 'Orthodontist',
        clinicName: 'Rajesh Dental Clinic',
        clinicAddress: '123, Health Avenue, Mumbai',
        yearsOfPractice: 5
    },
    addresses: [
        {
            id: 1,
            type: 'Clinic',
            name: 'Rajesh Dental Clinic',
            street: '123, Health Avenue',
            city: 'Mumbai',
            state: 'Maharashtra',
            zip: '400001',
            phone: '+91 98765 43210',
            isDefault: true
        }
    ],
    orders: [],
    cart: [],
    wishlist: []
};
