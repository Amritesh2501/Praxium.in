import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true }, // Custom ID from JSON
    name: { type: String, required: true },
    email: { type: String, required: true },
    role: { type: String, default: 'student' },
    password: { type: String, required: true },
    streak: { type: Number, default: 0 },
    permissions: { type: String, default: 'standard' },
    completedCourses: { type: Array, default: [] },
    achievements: { type: Array, default: [] }
}, { timestamps: true });

export const User = mongoose.model('User', userSchema);
