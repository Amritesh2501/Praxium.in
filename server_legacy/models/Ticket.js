import mongoose from 'mongoose';

const ticketMessageSchema = new mongoose.Schema({
    senderId: { type: String, required: true }, // User ID or 'ADMIN'
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
});

const ticketSchema = new mongoose.Schema({
    ticketId: { type: String, required: true, unique: true },
    studentId: { type: String, required: true },
    subject: { type: String, required: true },
    status: { type: String, enum: ['open', 'in-progress', 'resolved', 'closed'], default: 'open' },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    messages: [ticketMessageSchema]
}, { timestamps: true });

export const Ticket = mongoose.model('Ticket', ticketSchema);
