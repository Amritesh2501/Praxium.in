import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './db.js';

// Import Models
import { User } from './models/User.js';
import { Course } from './models/Course.js';
import { Enrollment } from './models/Enrollment.js';
import { SuggestedCourse } from './models/SuggestedCourse.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const seedData = async () => {
    try {
        await connectDB();

        // Read JSON files
        const usersData = JSON.parse(await fs.readFile(path.join(__dirname, 'data', 'users.json'), 'utf-8'));
        const coursesData = JSON.parse(await fs.readFile(path.join(__dirname, 'data', 'courses.json'), 'utf-8'));
        const enrollmentsData = JSON.parse(await fs.readFile(path.join(__dirname, 'data', 'enrollments.json'), 'utf-8'));
        const suggestedCoursesData = JSON.parse(await fs.readFile(path.join(__dirname, 'data', 'suggestedCourses.json'), 'utf-8'));

        console.log('🗑️  Clearing existing data...');
        await User.deleteMany({});
        await Course.deleteMany({});
        await Enrollment.deleteMany({});
        await SuggestedCourse.deleteMany({});

        console.log('🌱 Seeding new data...');

        await User.insertMany(usersData);
        console.log(`✅ Added ${usersData.length} users`);

        await Course.insertMany(coursesData);
        console.log(`✅ Added ${coursesData.length} courses`);

        await Enrollment.insertMany(enrollmentsData);
        console.log(`✅ Added ${enrollmentsData.length} enrollments`);

        await SuggestedCourse.insertMany(suggestedCoursesData);
        console.log(`✅ Added ${suggestedCoursesData.length} suggested courses`);

        console.log('🎉 Data Import Completed Successfully!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error with data import:', error);
        process.exit(1);
    }
};

seedData();
