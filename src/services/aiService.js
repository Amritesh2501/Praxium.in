// API_KEY is no longer needed on the client side!
// The backend proxy handles it securely.
const API_URL = "http://localhost:3000/api/generate";

export const generateAIResponse = async (userMessage, imageFile = null) => {
    try {
        let image = undefined;

        if (imageFile) {
            const base64Data = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(imageFile);
                reader.onload = () => resolve(reader.result.split(',')[1]);
                reader.onerror = error => reject(error);
            });

            image = {
                mime_type: imageFile.type,
                data: base64Data
            };
        }

        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                prompt: userMessage,
                image: image
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            // If it's a 429 from our proxy, show a nice message
            if (response.status === 429) {
                return "You're going too fast! Please wait a moment.";
            }
            return `Error: ${errorData.error?.message || response.statusText}`;
        }

        const data = await response.json();
        return data.text;

    } catch (error) {
        console.error("AI Service Error:", error);
        return "Error: Unable to reach AI server. Is the backend running?";
    }
};

const cleanJSON = (text) => {
    return text.replace(/```json/g, '').replace(/```/g, '').trim();
};

export const generateCourseSyllabus = async (courseTitle) => {
    const prompt = `
        Create a detailed 5-module syllabus for a course titled "${courseTitle}".
        For each module, provide:
        1. "title": The module title.
        2. "content": Detailed educational content in Markdown format. clearly explaining concepts with headings, bullet points, and code snippets if applicable.
        3. "videoId": A specific, relevant YouTube Video ID (the 11-character string, e.g., 'dQw4w9WgXcQ') that covers this topic. If you don't know a specific one, search your knowledge base for a very popular tutorial on this specific topic and provide its ID. Do not make up invalid IDs if possible, or provide a generic valid one for the topic.
        
        Return the response as a JSON object with this structure:
        {
            "modules": [
                { "title": "...", "content": "...", "videoId": "..." }
            ]
        }
    `;

    try {
        const response = await generateAIResponse(prompt);
        return JSON.parse(cleanJSON(response));
    } catch (error) {
        console.error("AI Syllabus Generation Error:", error);
        return null;
    }
};

export const generateQuiz = async (courseTitle) => {
    // Add randomness to prompt to avoid caching
    const seed = Date.now();
    const prompt = `Generate a UNIQUE and FRESH 20-question multiple-choice quiz for the course "${courseTitle}". Ensure questions are different from previous sets. Seed: ${seed}. Return ONLY valid JSON in this format: { "questions": [{ "id": 1, "text": "Question?", "options": ["A", "B", "C", "D"], "correctAnswer": "Correct Option Text" }] }`;
    try {
        const text = await generateAIResponse(prompt);
        if (!text || text.startsWith("Error:")) {
            console.error("Quiz Generation Failed:", text);
            return null;
        }
        console.log("Raw AI Quiz Response:", text); // Debugging
        return JSON.parse(cleanJSON(text));
    } catch (e) {
        console.error("Quiz Gen Error", e);
        return null;
    }
};

export const analyzeQuizResults = async (questions, userAnswers, courseTitle = "this course") => {
    // 1. Calculate Score Locally
    let correctCount = 0;
    const incorrectQuestions = [];

    questions.forEach(q => {
        const userAnswer = userAnswers[q.id]; // Assuming userAnswers is { id: "Option Text" }
        // Note: In a real app we might compare IDs, but here we compare text
        if (userAnswer === q.correctAnswer) {
            correctCount++;
        } else {
            incorrectQuestions.push({
                question: q.text,
                userAnswer: userAnswer,
                correctAnswer: q.correctAnswer
            });
        }
    });

    const score = Math.round((correctCount / questions.length) * 100);

    // 2. Ask AI for Feedback & Weak Topics only (Reduced Prompt)
    const prompt = `
    Student scored ${score}% (${correctCount}/${questions.length}) in "${courseTitle}".
    
    Here are the questions they got WRONG:
    ${JSON.stringify(incorrectQuestions)}
    
    Based on these mistakes, provide:
    1. A short, encouraging feedback sentence.
    2. A list of 1-3 specific sub-topics they are weak in (to suggest study material).
    
    CRITICAL: If the list of wrong questions is not empty, you MUST return at least one weak topic.
    
    Return ONLY valid JSON: { "feedback": "String", "weakTopics": ["Topic 1", "Topic 2"] }
    `;

    try {
        const text = await generateAIResponse(prompt);
        // Fallback for AI Error
        if (!text || text.startsWith("Error:")) {
            console.error("Analysis Failed:", text);
            return {
                score,
                feedback: "Great effort! Review the questions you missed to improve.",
                weakTopics: incorrectQuestions.length > 0 ? [`${courseTitle} Fundamentals`] : []
            };
        }

        const aiResult = JSON.parse(cleanJSON(text));

        // Robustness: ensure weakTopics has data if there were errors
        let suggestions = aiResult.weakTopics || [];
        if (suggestions.length === 0 && incorrectQuestions.length > 0) {
            suggestions = [`${courseTitle} Review`];
        }

        // Combine local score with AI insights
        return {
            score: score,
            feedback: aiResult.feedback || "Good job on completing the quiz.",
            weakTopics: suggestions
        };

    } catch (e) {
        console.error("Analysis JSON Error", e);
        // Fallback on JSON error
        return {
            score,
            feedback: "Assessment complete. Keep learning!",
            weakTopics: incorrectQuestions.length > 0 ? [`${courseTitle} Basics`] : []
        };
    }
};

export const generateLevelContent = async (topic, level) => {
    // Difficulty scaling based on level
    const difficulty = level === 1 ? "Beginner" : level < 5 ? "Intermediate" : "Advanced";

    const prompt = `Create a ${difficulty} level lesson for the course "${topic}". Level ${level}.
    
    Return ONLY valid JSON with this structure:
    {
        "lessonTitle": "Catchy Title for Level ${level}",
        "lessonContent": "Markdown formatted educational content. Explain concepts clearly with examples suitable for a ${difficulty} student.",
        "videoId": "A specific, valid YouTube Video ID (e.g., dQw4w9WgXcQ) relevant to this topic. Ensure it is a PUBLIC educational video. IF UNKNOWN, leave empty.",
        "youtubeQuery": "A search query string to find relevant videos on YouTube (e.g., '${topic} level ${level} tutorial')",
        "quiz": {
            "question": "A conceptual multiple-choice question based on this lesson.",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correctAnswer": "The correct option string"
        }
    }`;

    try {
        const text = await generateAIResponse(prompt);
        if (!text || text.startsWith("Error:")) {
            throw new Error(text);
        }
        return JSON.parse(cleanJSON(text));
    } catch (e) {
        console.error("Level Gen Error", e);
        throw e;
    }
};
