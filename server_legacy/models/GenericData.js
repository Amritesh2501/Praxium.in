import mongoose from 'mongoose';

const genericDataSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true },
    data: { type: mongoose.Schema.Types.Mixed, required: true }
}, { timestamps: true });

export const GenericData = mongoose.model('GenericData', genericDataSchema);
