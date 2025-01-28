// server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { GoogleGenerativeAI } = require('@google/generative-ai');

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Initialize Gemini API with Pro model
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

app.post('/api/chat', async (req, res) => {
    try {
        const userMessage = req.body.message;
        
        if (!userMessage) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Enhanced prompt for better programming responses
        const prompt = `As an expert programming assistant, please help with this question:
${userMessage}

Please provide:
1. Clear explanation
2. Code examples if relevant
3. Best practices and recommendations
4. Common pitfalls to avoid
5. Any relevant additional context`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const aiResponse = response.text();

        res.json({ message: aiResponse });

    } catch (error) {
        console.error('Error details:', error);
        
        let errorMessage = 'An error occurred while processing your request';
        if (error.message?.includes('API key')) {
            errorMessage = 'Invalid API key. Please check your Gemini API key configuration.';
        }
        
        res.status(500).json({ 
            error: errorMessage,
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        model: 'gemini-pro'
    });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log('Using Gemini Pro model for responses');
});