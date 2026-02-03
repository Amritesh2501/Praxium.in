import mongoose from 'mongoose';

const moduleSchema = new mongoose.Schema({
    title: String,
    level: String,
    content: String,
    notes: String,
    tips: String,
    videoId: String,
    youtubeQuery: String
});

const questionSchema = new mongoose.Schema({
    question: String,
    options: [String],
    correctAnswer: Number // index of the correct option
});

const assessmentSchema = new mongoose.Schema({
    title: { type: String, default: 'Final Assessment' },
    questions: [questionSchema]
});

const courseSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    description: String,
    instructorId: { type: String, default: 'TCH-2026-001' },
    currentLevel: { type: Number, default: 1 },
    isAI: { type: Boolean, default: false },
    modules: [moduleSchema],
    assessment: assessmentSchema
}, { timestamps: true });

export const Course = mongoose.model('Course', courseSchema);
