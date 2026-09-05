const express = require('express');
const aiBotService = require('../services/aiBotService');
const ApiResponse = require('../utils/response');

const router = express.Router();

// AI Chat endpoint
router.post('/chat', (req, res) => {
    const { message } = req.body;
    
    if (!message) {
        return res.status(400).json({ success: false, message: 'Message is required' });
    }
    
    const response = aiBotService.generateResponse(message);
    
    return res.json({
        success: true,
        data: {
            response,
            timestamp: new Date().toISOString()
        }
    });
});

// Get AI suggestions
router.get('/suggestions', (req, res) => {
    const suggestions = [
        '💼 Find me IT jobs',
        '📄 How to create a resume?',
        '🏢 Register my company',
        '📅 Interview tips',
        '💰 Salary ranges in Ethiopia',
        '📝 How to apply for jobs?'
    ];
    
    return res.json({ success: true, data: suggestions });
});

// AI Resume Analysis
router.post('/resume-analysis', async (req, res) => {
    const { resume_text } = req.body;
    
    if (!resume_text) {
        return res.status(400).json({ success: false, message: 'Resume text required' });
    }
    
    // Simple analysis
    const wordCount = resume_text.split(/\s+/).length;
    const hasSkills = resume_text.toLowerCase().includes('skill') || resume_text.toLowerCase().includes('experience');
    const hasEducation = resume_text.toLowerCase().includes('education') || resume_text.toLowerCase().includes('degree');
    
    const feedback = [];
    let score = 0;
    
    if (wordCount > 50) { score += 30; } else { feedback.push('Your resume is too short. Add more details.'); }
    if (hasSkills) { score += 25; } else { feedback.push('Add your skills section.'); }
    if (hasEducation) { score += 25; } else { feedback.push('Add your education details.'); }
    if (wordCount > 100) { score += 20; } else { feedback.push('Expand your experience descriptions.'); }
    
    return res.json({
        success: true,
        data: {
            score: Math.min(score, 100),
            wordCount,
            feedback: feedback.length > 0 ? feedback : ['Your resume looks good! Keep it updated.'],
            suggestions: [
                'Add quantifiable achievements',
                'Use action verbs',
                'Tailor resume to specific jobs',
                'Keep formatting consistent'
            ]
        }
    });
});

module.exports = router;
