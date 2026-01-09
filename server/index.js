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
const DATA_DIR = path.join(__dirname, 'data');

// Ensure Data Directory Exists
(async () => {
    try {
        await fs.mkdir(DATA_DIR, { recursive: true });
        console.log(`📂 Data directory ready at ${DATA_DIR}`);
    } catch (err) {
        console.error("Failed to create data dir:", err);
    }
})();

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

// --- Persistence Routes ---

// GET Data
app.get('/api/data/:key', async (req, res) => {
    try {
        const { key } = req.params;
        // Simple security: Allow only alphanumeric keys to prevent traversal
        if (!/^[a-zA-Z0-9_]+$/.test(key)) {
            return res.status(400).json({ error: "Invalid key format" });
        }

        const filePath = path.join(DATA_DIR, `${key}.json`);

        try {
            const data = await fs.readFile(filePath, 'utf-8');
            res.json(JSON.parse(data));
        } catch (err) {
            if (err.code === 'ENOENT') {
                return res.json(null); // Return null if file doesn't exist yet
            }
            throw err;
        }
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

        const filePath = path.join(DATA_DIR, `${key}.json`);
        await fs.writeFile(filePath, JSON.stringify(req.body, null, 2)); // Pretty print for debug

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

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
