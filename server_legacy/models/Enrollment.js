import mongoose from 'mongoose';

const enrollmentSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    studentId: { type: String, required: true },
    courseId: { type: String, required: true }
}, { timestamps: true });

export const Enrollment = mongoose.model('Enrollment', enrollmentSchema);
