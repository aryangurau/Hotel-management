const mongoose = require('mongoose');
const User = require('../modules/users/user.model');

async function updateAdmin() {
    try {
        // Connect to MongoDB (use your actual connection string)
        await mongoose.connect('mongodb://localhost:27017/hotel-management');
        console.log('Connected to MongoDB');

        // Find and update the admin user
        const adminEmail = 'infohub328@gmail.com';
        const result = await User.findOneAndUpdate(
            { email: adminEmail },
            { 
                $addToSet: { roles: 'admin' },
                isActive: true,
                isBlocked: false
            },
            { new: true }
        );

        if (result) {
            console.log('Admin user updated:', {
                email: result.email,
                roles: result.roles,
                isActive: result.isActive,
                isBlocked: result.isBlocked
            });
        } else {
            console.log('Admin user not found');
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

updateAdmin();
