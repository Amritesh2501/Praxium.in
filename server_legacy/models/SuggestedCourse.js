import mongoose from 'mongoose';

const suggestedCourseSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    title: String,
    description: String,
    isAI: { type: Boolean, default: true },
    type: { type: String, enum: ['course', 'game', 'revision'], default: 'course' }, // 'game' triggers the Revision Game UI
    currentLevel: { type: Number, default: 1 }
}, { timestamps: true });

export const SuggestedCourse = mongoose.model('SuggestedCourse', suggestedCourseSchema);
