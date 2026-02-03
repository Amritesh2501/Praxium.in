import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { z } from 'zod';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// const DATA_DIR = path.join(__dirname, 'data'); // No longer needed for Mongo, but keeping for reference if needed

// Connect to MongoDB
import connectDB from './db.js';
import { User } from './models/User.js';
import { Course } from './models/Course.js';
import { Enrollment } from './models/Enrollment.js';
import { SuggestedCourse } from './models/SuggestedCourse.js';
import { GenericData } from './models/GenericData.js';
import { Message } from './models/Message.js';
import { Ticket } from './models/Ticket.js';

connectDB();

// Ensure Data Directory Exists
// Ensure Data Directory Exists (Optional now, but good for backup/logging)
// (async () => {
//     try {
//         await fs.mkdir(path.join(__dirname, 'data'), { recursive: true });
//     } catch (err) {
//         console.error("Failed to create data dir:", err);
//     }
// })();

const app = express();
const PORT = process.env.PORT || 3000;

// Security Middleware
app.use(helmet()); // Secure HTTP headers
app.use(cors()); // Allow Cross-Origin requests (configure strict origin in prod)
app.use(express.json({ limit: '10mb' })); // Limit body size to prevent DoS

// Rate Limiting: 15 requests per minute per IP
const apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 15,
    message: { error: { message: "Too many requests, please slow down." } },
    standardHeaders: true,
    legacyHeaders: false,
});

// --- Persistence Routes (MongoDB) ---

// GET Data
app.get('/api/data/:key', async (req, res) => {
    try {
        const { key } = req.params;
        if (!/^[a-zA-Z0-9_]+$/.test(key)) {
            return res.status(400).json({ error: "Invalid key format" });
        }

        let data;
        switch (key) {
            case 'users':
                data = await User.find({});
                break;
            case 'courses':
                data = await Course.find({});
                break;
            case 'enrollments':
                data = await Enrollment.find({});
                break;
            case 'suggestedCourses':
                data = await SuggestedCourse.find({});
                break;
            default:
                const doc = await GenericData.findOne({ key });
                data = doc ? doc.data : null;
        }

        res.json(data);
    } catch (error) {
        console.error("Read Error:", error);
        res.status(500).json({ error: "Failed to read data" });
    }
});

// SAVE Data
app.post('/api/data/:key', async (req, res) => {
    try {
        const { key } = req.params;
        if (!/^[a-zA-Z0-9_]+$/.test(key)) {
            return res.status(400).json({ error: "Invalid key format" });
        }

        const body = req.body;

        switch (key) {
            case 'users':
                if (Array.isArray(body)) {
                    await User.deleteMany({});
                    await User.insertMany(body);
                } else {
                    // Update or Insert single user
                    await User.findOneAndUpdate({ id: body.id }, body, { upsert: true });
                }
                break;
            case 'courses':
                if (Array.isArray(body)) {
                    await Course.deleteMany({});
                    await Course.insertMany(body);
                } else {
                    await Course.findOneAndUpdate({ id: body.id }, body, { upsert: true });
                }
                break;
            case 'enrollments':
                if (Array.isArray(body)) {
                    await Enrollment.deleteMany({});
                    await Enrollment.insertMany(body);
                } else {
                    await Enrollment.findOneAndUpdate({ id: body.id }, body, { upsert: true });
                }
                break;
            case 'suggestedCourses':
                if (Array.isArray(body)) {
                    await SuggestedCourse.deleteMany({});
                    await SuggestedCourse.insertMany(body);
                } else {
                    await SuggestedCourse.findOneAndUpdate({ id: body.id }, body, { upsert: true });
                }
                break;
            default:
                await GenericData.findOneAndUpdate(
                    { key },
                    { data: body },
                    { upsert: true, new: true }
                );
        }

        res.json({ success: true });
    } catch (error) {
        console.error("Write Error:", error);
        res.status(500).json({ error: "Failed to save data" });
    }
});

// --- AI Routes ---
const generateSchema = z.object({
    prompt: z.string().min(1).max(5000), // Enforce reasonable length
    image: z.object({
        mime_type: z.string().regex(/^image\/(png|jpeg|webp|heic|heif)$/),
        data: z.string().base64()
    }).optional()
});

// API Route
app.post('/api/generate', apiLimiter, async (req, res) => {
    try {
        // 1. Validate Input
        const validation = generateSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                error: { message: "Invalid input", details: validation.error.errors }
            });
        }

        const { prompt, image } = validation.data;
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            console.error("Server Error: JSON Key missing");
            return res.status(500).json({ error: { message: "Server configuration error" } });
        }

        // 2. Prepare payload for Gemini
        const parts = [{ text: prompt }];
        if (image) {
            parts.push({
                inline_data: {
                    mime_type: image.mime_type,
                    data: image.data
                }
            });
        }

        // 3. Call Google API (Server-to-Server)
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts }] }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));

            // Handle specific upstream errors
            if (response.status === 429) {
                return res.status(429).json({ error: { message: "AI Service busy (Quota exceeded). Try again later." } });
            }

            return res.status(response.status).json({
                error: { message: errorData.error?.message || "AI Service Error" }
            });
        }

        const data = await response.json();

        // Return only the text content to the client
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) {
            return res.status(500).json({ error: { message: "No response text generated" } });
        }

        res.json({ text });

    } catch (error) {
        console.error("Proxy Error:", error);
        res.status(500).json({ error: { message: "Internal Server Error" } });
    }
});

// --- Course Generation Route ---
app.post('/api/courses/generate', async (req, res) => {
    try {
        const { topic, instructorId, level } = req.body;

        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ error: "Server missing API Key" });
        }

        const prompt = `
        Create a comprehensive online course about "${topic}" for a ${level || 'Beginner'} audience.
        
        CRITICAL: Output MUST be valid JSON. Do not include markdown formatting like \`\`\`json.
        Structure:
        {
            "title": "Course Title",
            "description": "Short description",
            "modules": [
                {
                    "title": "Module Title",
                    "content": "Detailed educational content in Markdown format. Should be at least 3 paragraphs long.",
                    "level": "${level || 'Beginner'}",
                    "notes": "Key takeaways (markdown bullet points)",
                    "tips": "Practical tips (markdown)",
                    "videoId": "dQw4w9WgXcQ", 
                    "youtubeQuery": "Search query for a relevant video"
                }
            ],
            "assessment": {
                "title": "${topic} Final Exam",
                "questions": [
                    {
                        "question": "Question text?",
                        "options": ["Option A", "Option B", "Option C", "Option D"],
                        "correctAnswer": 0
                    }
                ]
            }
        }
        Requirements:
        1. Generate at least 3 modules.
        2. "videoId" is REQUIRED for every module. Use "dQw4w9WgXcQ" (Rick Roll) as a safe placeholder if no specific ID is known, or try to predict a real one. NEVER return null.
        3. Ensure content is educational, accurate, and lecture-style.
        `;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { response_mime_type: "application/json" }
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            console.error("Gemini API Error:", error);
            return res.status(500).json({ error: "AI Generation Failed" });
        }

        const data = await response.json();
        const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!generatedText) {
            return res.status(500).json({ error: "No content generated" });
        }

        const courseData = JSON.parse(generatedText);

        // Save to DB
        const newCourse = new Course({
            id: 'c_' + Date.now(),
            ...courseData,
            instructorId: instructorId || 'TCH-2026-001',
            isAI: true,
            currentLevel: 1
        });

        await newCourse.save();
        res.json(newCourse);

    } catch (error) {
        console.error("Course Generation Error:", error);
        res.status(500).json({ error: "Failed to generate course" });
    }
});

// --- Chat Routes ---

// Get List of Conversations for a User
app.get('/api/chat/conversations/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        // Find all messages involving this user
        const messages = await Message.find({
            $or: [{ senderId: userId }, { receiverId: userId }]
        });

        // Extract unique other user IDs
        const otherUserIds = new Set();
        messages.forEach(msg => {
            otherUserIds.add(msg.senderId === userId ? msg.receiverId : msg.senderId);
        });

        // Fetch user details for these IDs
        const users = await User.find({ id: { $in: Array.from(otherUserIds) } }).select('id name email role');

        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch conversations" });
    }
});

// Get Messages between two users
app.get('/api/chat/:userId/:otherId', async (req, res) => {
    try {
        const { userId, otherId } = req.params;
        const messages = await Message.find({
            $or: [
                { senderId: userId, receiverId: otherId },
                { senderId: otherId, receiverId: userId }
            ]
        }).sort({ createdAt: 1 });
        res.json(messages);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch messages" });
    }
});

// Send Message
app.post('/api/chat/send', async (req, res) => {
    try {
        const { senderId, receiverId, content } = req.body;
        const message = new Message({ senderId, receiverId, content });
        await message.save();
        res.json(message);
    } catch (error) {
        res.status(500).json({ error: "Failed to send message" });
    }
});

// Get Assigned Teacher for a Student (Logic: Find first enrolled course's instructor)
app.get('/api/student/:studentId/teacher', async (req, res) => {
    try {
        const { studentId } = req.params;
        // 1. Find enrollments for student
        const enrollment = await Enrollment.findOne({ studentId });

        if (!enrollment) {
            // Fallback if no enrollment: Return default demo teacher
            return res.json({ instructorId: 'TCH-2026-001', name: "Teacher User" });
        }

        const course = await Course.findOne({ id: enrollment.courseId });
        if (!course || !course.instructorId) {
            return res.json({ instructorId: 'TCH-2026-001', name: "Teacher User" });
        }

        const teacher = await User.findOne({ id: course.instructorId });
        res.json({
            instructorId: teacher.id,
            name: teacher.name,
            email: teacher.email
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to find teacher" });
    }
});


// --- Ticket Routes ---

// Get All Tickets (Admin) or My Tickets (Student)
app.get('/api/tickets', async (req, res) => {
    try {
        const { role, userId } = req.query; // Pass role/userId as query params for simplicity
        let query = {};
        if (role === 'student') {
            query = { studentId: userId };
        }
        // If admin, query is empty (fetch all)

        const tickets = await Ticket.find(query).sort({ updatedAt: -1 });
        res.json(tickets);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch tickets" });
    }
});

// Create Ticket
app.post('/api/tickets', async (req, res) => {
    try {
        const { studentId, subject, content, priority } = req.body;
        const ticketId = 'TKT-' + Date.now();

        const ticket = new Ticket({
            ticketId,
            studentId,
            subject,
            priority,
            messages: [{ senderId: studentId, content }]
        });

        await ticket.save();
        res.json(ticket);
    } catch (error) {
        res.status(500).json({ error: "Failed to create ticket" });
    }
});

// Respond to Ticket
app.post('/api/tickets/:ticketId/respond', async (req, res) => {
    try {
        const { ticketId } = req.params;
        const { senderId, content, status } = req.body;

        const ticket = await Ticket.findOne({ ticketId });
        if (!ticket) return res.status(404).json({ error: "Ticket not found" });

        ticket.messages.push({ senderId, content });
        if (status) ticket.status = status;

        await ticket.save();
        res.json(ticket);
    } catch (error) {
        res.status(500).json({ error: "Failed to respond to ticket" });
    }
});

// --- Assessment Routes ---

app.post('/api/courses/:courseId/assessment/submit', async (req, res) => {
    try {
        const { courseId } = req.params;
        const { studentId, answers } = req.body; // answers: { questionIndex: optionIndex }

        const course = await Course.findOne({ id: courseId });
        if (!course || !course.assessment) {
            return res.status(404).json({ error: "Assessment not found" });
        }

        // 1. Calculate Score
        let correctCount = 0;
        const total = course.assessment.questions.length;
        const incorrectTopics = [];

        course.assessment.questions.forEach((q, index) => {
            const userAns = answers[index];
            if (userAns === q.correctAnswer) {
                correctCount++;
            } else {
                incorrectTopics.push(q.question); // Collect topics where user failed
            }
        });

        const score = (correctCount / total) * 100;

        // 2. Generate Suggested Revision Topics (AI) if score < 80% and we have data
        if (score < 80 && incorrectTopics.length > 0) {
            const prompt = `
             The student failed questions related to: ${incorrectTopics.join(', ')}.
             Based on this, generate 2 "Game-like Revision" topics to help them understand these concepts better.
             Output valid JSON:
             [
                { "title": "Fun Title", "description": "Engaging description", "type": "game" }
             ]
             `;

            try {
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: { response_mime_type: "application/json" }
                    }),
                });

                const data = await response.json();
                const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
                if (text) {
                    const suggestions = JSON.parse(text);

                    // Save Suggestions
                    const savedSuggestions = [];
                    for (const s of suggestions) {
                        const newSuggestion = new SuggestedCourse({
                            id: 'gs_' + Date.now() + Math.random().toString(36).substr(2, 5),
                            title: s.title,
                            description: s.description,
                            type: 'game', // Flag as game/revision
                            isAI: true
                        });
                        await newSuggestion.save();
                        savedSuggestions.push(newSuggestion);
                    }
                    console.log(`Generated ${savedSuggestions.length} revision games for Student ${studentId}`);
                }
            } catch (aiError) {
                console.error("Failed to generate revision suggestions", aiError);
            }
        }

        // 3. Update User Progress (Mock)
        // In real app, push to user.completedCourses or achievements

        res.json({
            score,
            total,
            correctCount,
            passed: score >= 60,
            message: score >= 60 ? "Great job!" : "Don't worry, we've generated some games to help you improve!"
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Submission failed" });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
