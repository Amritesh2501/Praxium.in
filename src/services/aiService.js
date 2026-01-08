const API_KEY = "AIzaSyDpTH0YTKB-e-nzP6NitSkoBrGFDjwl0aA"; // USER_TODO: Paste your Gemini API Key here

export const generateAIResponse = async (userMessage, imageFile = null) => {
    if (!API_KEY) {
        return "I need an API Key to think! Please add your Google Gemini API key in 'src/services/aiService.js'.";
    }

    try {
        let parts = [{ text: userMessage }];

        if (imageFile) {
            const base64Data = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(imageFile);
                reader.onload = () => resolve(reader.result.split(',')[1]);
                reader.onerror = error => reject(error);
            });

            parts.push({
                inline_data: {
                    mime_type: imageFile.type,
                    data: base64Data
                }
            });
        }

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                contents: [{ parts: parts }],
            }),
        });

        const data = await response.json();

        if (data.error) {
            return `Error: ${data.error.message}`;
        }

        return data.candidates[0].content.parts[0].text;
    } catch (error) {
        console.error("AI API Error:", error);
        return "Sorry, I'm having trouble connecting to my brain right now.";
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
    const prompt = `Generate a 20-question multiple-choice quiz for the course "${courseTitle}". Return ONLY valid JSON in this format: { "questions": [{ "id": 1, "text": "Question?", "options": ["A", "B", "C", "D"], "correctAnswer": "Correct Option Text" }] }`;
    try {
        const text = await generateAIResponse(prompt);
        return JSON.parse(cleanJSON(text));
    } catch (e) {
        console.error("Quiz Gen Error", e);
        return null;
    }
};

export const analyzeQuizResults = async (questions, userAnswers) => {
    const prompt = `Analyze these quiz results. Questions: ${JSON.stringify(questions)}. User Answers (key=questionId, value=selectedOption): ${JSON.stringify(userAnswers)}. Return ONLY valid JSON: { "score": 0-100, "feedback": "Short motivating feedback string", "weakTopics": ["Topic 1", "Topic 2"] }`;
    try {
        const text = await generateAIResponse(prompt);
        return JSON.parse(cleanJSON(text));
    } catch (e) {
        console.error("Analysis Error", e);
        return { score: 0, feedback: "Error analyzing results.", weakTopics: [] };
    }
};

export const generateLevelContent = async (topic, level) => {
    const prompt = `Create a gamified learning lesson for "${topic}" at Level ${level}. Return ONLY valid JSON: { "lessonTitle": "Fun Title", "lessonContent": "Markdown content for the lesson...", "quiz": { "question": "Mini-quiz question?", "options": ["A", "B", "C", "D"], "correctAnswer": "Correct Option" } }`;
    try {
        const text = await generateAIResponse(prompt);
        return JSON.parse(cleanJSON(text));
    } catch (e) {
        console.error("Level Gen Error", e);
        return null;
    }
};
