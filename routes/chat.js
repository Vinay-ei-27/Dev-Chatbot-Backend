// routes/chat.js
const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const ChatSession = require('../models/ChatSession');
const auth = require('../middleware/auth');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Get all chat sessions
router.get('/sessions', auth, async (req, res) => {
  try {
    const sessions = await ChatSession.find({})
      .sort({ createdAt: -1 })
      .select('sessionId title createdAt');
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch chat sessions' });
  }
});

// Get chat history for a session
router.get('/history/:sessionId', auth, async (req, res) => {
  try {
    const session = await ChatSession.findOne({ sessionId: req.params.sessionId });
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    res.json(session);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch chat history' });
  }
});

// Delete a chat session
router.delete('/session/:sessionId', auth, async (req, res) => {
  try {
    await ChatSession.deleteOne({ sessionId: req.params.sessionId });
    res.json({ message: 'Session deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete session' });
  }
});

// Chat endpoint
router.post('/', auth, async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    
    if (!message || !sessionId) {
      return res.status(400).json({ error: 'Message and sessionId are required' });
    }

    // Find or create session
    let session = await ChatSession.findOne({ sessionId });
    if (!session) {
      const titleResult = await model.generateContent(
        `Generate a very short title (max 4 words) for a conversation starting with: ${message}`
      );
      const title = titleResult.response.text().slice(0, 50);

      session = new ChatSession({
        sessionId,
        title,
        messages: []
      });
    }

    // Get previous messages for context
    const context = session.messages.map(msg => 
      `${msg.role}: ${msg.content}`
    ).join('\n\n');

    const prompt = `
Previous conversation:
${context}

Current question:
${message}

As an expert programming assistant, please provide:
1. Clear explanation
2. Code examples if relevant
3. Best practices and recommendations
4. Common pitfalls to avoid
5. Any relevant additional context`;

    const result = await model.generateContent(prompt);
    const aiResponse = result.response.text();

    // Update session with new messages
    session.messages.push(
      { role: 'user', content: message },
      { role: 'assistant', content: aiResponse }
    );
    await session.save();

    res.json({ 
      message: aiResponse,
      sessionId: session.sessionId,
      title: session.title
    });

  } catch (error) {
    console.error('Error details:', error);
    res.status(500).json({ 
      error: 'An error occurred',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;