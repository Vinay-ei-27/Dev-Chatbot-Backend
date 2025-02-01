const mongoose = require('mongoose');

const chatSessionSchema = new mongoose.Schema({
    sessionId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    messages: [{
        role: {
            type: String,
            required: true,
            enum: ['user', 'assistant', 'system']
        },
        content: {
            type: String,
            required: true
        },
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Update lastUpdated on every save
chatSessionSchema.pre('save', function(next) {
    this.lastUpdated = new Date();
    next();
});

// Add indexes for better query performance
chatSessionSchema.index({ lastUpdated: -1 });
chatSessionSchema.index({ createdAt: -1 });

const ChatSession = mongoose.model('ChatSession', chatSessionSchema);

module.exports = ChatSession;