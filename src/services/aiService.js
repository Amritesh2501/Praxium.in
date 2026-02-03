// API_KEY is no longer needed on the client side!
// The backend proxy handles it securely.
const API_URL = "/api/generate";

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
        Create an UNBELIEVABLY COMPREHENSIVE 30-module syllabus for a course titled "${courseTitle}".
        The course MUST have EXACTLY 30 modules, divided into 3 distinct parts (Sections):
        - Section 1: Fundamentals (Modules 1-10)
        - Section 2: Intermediate (Modules 11-20)
        - Section 3: Advanced & Mastery (Modules 21-30)
        
        It is CRITICAL that you provide EXACTLY 10 modules for each section.
        
        For each module, provide:
        1. "title": The module title (e.g., "Module 1: Foundations of...").
        2. "section": The section title (MUST be exactly "Section 1: Fundamentals", "Section 2: Intermediate", or "Section 3: Advanced & Mastery").
        3. "content": EXTREMELY DETAILED educational content in Markdown format. 
           - It MUST explain every concept clearly across multiple long paragraphs.
           - Include "Key Concepts", "Detailed Explanations", "Real-world Examples", and "Code Snippets" (if technical).
           - The content should be substantial (at least 300 words per module).
           - Do not just summarize; TEACH the topic.
        4. "videoId": A specific, relevant YouTube Video ID (11 chars). If unknown, leave empty.
        5. "youtubeQuery": A short, specific search query to find a video tutorial for this module (e.g., "React Hooks tutorial").
        6. "notes": A short list of bullet points (2-3) summarizing key takeaways or interesting facts.
        7. "tips": A short blockquote (> Tip) style advice or insight for the student.
        
        Return the response as a JSON object with this structure:
        {
            "modules": [
                { "title": "...", "section": "...", "content": "...", "videoId": "...", "youtubeQuery": "...", "notes": "...", "tips": "..." }
            ]
        }
    `;

    try {
        const response = await generateAIResponse(prompt);
        return JSON.parse(cleanJSON(response));
    } catch (error) {
        console.error("AI Syllabus Generation Error:", error);
        return { modules: [] }; // Fallback
    }
};

export const askTutor = async (courseTitle, moduleTitle, moduleContent, userQuestion) => {
    const prompt = `
        You are an expert tutor for the course "${courseTitle}".
        The student is currently studying "${moduleTitle}".
        
        Here is the content they are reading:
        """
        ${moduleContent.substring(0, 1500)}... (truncated)
        """
        
        The student has asked: "${userQuestion}"
        
        Provide a clear, helpful, and concise explanation to answer their question. 
        Use the context provided but feel free to expand if necessary to be helpful. 
        Keep the tone encouraging and professional.
    `;
    return await generateAIResponse(prompt);
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
        // Fallback Content so the UI doesn't break
        return {
            lessonTitle: `${topic} - Level ${level}`,
            lessonContent: `### Content Temporarily Unavailable\n\nWe couldn't generate the specific lesson content right now. \n\n**Self-Study Task:**\n1. Search for **"${topic}"** on Google or YouTube.\n2. Focus on intermediate concepts.\n3. Come back to take the quiz!`,
            videoId: "",
            youtubeQuery: `${topic} level ${level} tutorial`,
            quiz: {
                question: "What is the primary focus of this topic?",
                options: ["Understanding core concepts", "Memorizing dates", "Ignoring details", "Wild guessing"],
                correctAnswer: "Understanding core concepts"
            }
        };
    }
};
