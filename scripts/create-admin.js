require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../modules/users/user.model');
const { genHash } = require('../utils/secure');

async function createAdminUser() {
    try {
        await mongoose.connect(process.env.DB_URL);
        console.log('Connected to database');

        // Admin user data
        const adminData = {
            name: 'Admin User',
            email: 'infohub328@gmail.com',
            password: genHash('123456'),
            roles: ['admin'],
            isActive: true,
            isBlocked: false
        };

        // Check if admin already exists
        const existingAdmin = await User.findOne({ email: adminData.email });
        if (existingAdmin) {
            // Update the existing admin
            existingAdmin.password = adminData.password;
            existingAdmin.isActive = true;
            existingAdmin.isBlocked = false;
            existingAdmin.roles = ['admin'];
            await existingAdmin.save();
            console.log('Admin user updated successfully');
        } else {
            // Create new admin
            await User.create(adminData);
            console.log('Admin user created successfully');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from database');
    }
}

createAdminUser();
