//const express = require('express');
//const cors = require('cors');
//const dotenv = require('dotenv');
//const { GoogleGenerativeAI } = require('@google/generative-ai');
//const connectDB = require('./config/db');
//const ChatSession = require('./models/ChatSession');

//dotenv.config({path : `${process.cwd()}/.env`});

//const app = express();
//const port = process.env.PORT || 3001;

//// Middlewares
//app.use(cors());
//app.use(express.json());

//// Connect to MongoDB
//connectDB();

//// Initialize Gemini API
//const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
//const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

//// Get all chat sessions
//app.get('/api/chat/sessions', async (req, res) => {
//  try {
//    const sessions = await ChatSession.find({})
//      .sort({ createdAt: -1 })
//      .select('sessionId title createdAt');
//    res.json(sessions);
//  } catch (error) {
//    res.status(500).json({ error: 'Failed to fetch chat sessions' });
//  }
//});

//// Get chat history for a session
//app.get('/api/chat/history/:sessionId', async (req, res) => {
//  try {
//    const session = await ChatSession.findOne({ sessionId: req.params.sessionId });
//    if (!session) {
//      return res.status(404).json({ error: 'Session not found' });
//    }
//    res.json(session);
//  } catch (error) {
//    res.status(500).json({ error: 'Failed to fetch chat history' });
//  }
//});

//// Delete a chat session
//app.delete('/api/chat/session/:sessionId', async (req, res) => {
//  try {
//    await ChatSession.deleteOne({ sessionId: req.params.sessionId });
//    res.json({ message: 'Session deleted successfully' });
//  } catch (error) {
//    res.status(500).json({ error: 'Failed to delete session' });
//  }
//});

//app.post('/api/chat', async (req, res) => {
//  try {
//    const { message, sessionId } = req.body;
    
//    if (!message || !sessionId) {
//      return res.status(400).json({ error: 'Message and sessionId are required' });
//    }

//    // Find or create session
//    let session = await ChatSession.findOne({ sessionId });
//    if (!session) {
//      // Generate title from first message
//      const titleResult = await model.generateContent(`Generate a very short title (max 4 words) for a conversation starting with: ${message}`);
//      const title = titleResult.response.text().slice(0, 50);

//      session = new ChatSession({
//        sessionId,
//        title,
//        messages: []
//      });
//    }

//    // Get previous messages for context
//    const context = session.messages.map(msg => 
//      `${msg.role}: ${msg.content}`
//    ).join('\n\n');

//    const prompt = `
//Previous conversation:
//${context}

//Current question:
//${message}

//As an expert programming assistant, please provide:
//1. Clear explanation
//2. Code examples if relevant
//3. Best practices and recommendations
//4. Common pitfalls to avoid
//5. Any relevant additional context`;

//    const result = await model.generateContent(prompt);
//    const aiResponse = result.response.text();

//    // Update session with new messages
//    session.messages.push(
//      { role: 'user', content: message },
//      { role: 'assistant', content: aiResponse }
//    );
//    await session.save();

//    res.json({ 
//      message: aiResponse,
//      sessionId: session.sessionId,
//      title: session.title
//    });

//  } catch (error) {
//    console.error('Error details:', error);
//    res.status(500).json({ 
//      error: 'An error occurred',
//      details: process.env.NODE_ENV === 'development' ? error.message : undefined
//    });
//  }
//});

//// Error handling middleware
//app.use((err, req, res, next) => {
//  console.error(err.stack);
//  res.status(500).json({ 
//      error: 'Something went wrong!',
//      details: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
//  });
//});

//// Start server
//const startServer = async () => {
//  try {
//      app.listen(port, () => {
//          console.log(`Server running on port ${port}`);
//          console.log('Using Gemini model for responses');
//      });
//  } catch (error) {
//      console.error('Error starting server:', error);
//      process.exit(1);
//  }
//};

//startServer();

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Import routes
const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');

// Load environment variables
dotenv.config({ path: `${process.cwd()}/.env` });

// Initialize express app
const app = express();
const port = process.env.PORT || 3001;

// Middlewares
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Connect to MongoDB
connectDB();

// Routes
app.use('/', authRoutes);
app.use('/api/chat', chatRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    environment: process.env.NODE_ENV
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    details: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// Start server
const startServer = async () => {
  try {
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
};

startServer();