// AI Bot Service for Bossjob Ethiopia
class AIBotService {
    constructor() {
        this.responses = {
            greeting: [
                "Hello! 👋 I'm Bossjob AI Assistant. How can I help you today?",
                "Welcome to Bossjob Ethiopia! I can help you with jobs, resumes, and more.",
                "Hi there! I'm here to assist you with your job search or hiring needs."
            ],
            jobs: [
                "Here are some job categories you can explore:\n\n💻 IT & Technology - 2,500+ jobs\n💰 Finance & Banking - 1,800+ jobs\n🏥 Healthcare - 1,200+ jobs\n📚 Education - 900+ jobs",
                "You can browse jobs by visiting our jobs page. We have positions in IT, Finance, Healthcare, and more!"
            ],
            resume: [
                "To create your resume:\n1. Go to Resume page\n2. Fill in Basic Info\n3. Add Work Experience\n4. Add Skills\n5. Add Education",
                "Your resume is important! Make sure to include your skills, experience, and education."
            ],
            apply: [
                "To apply for a job:\n1. Browse jobs\n2. Click 'Apply Now'\n3. Fill work preferences\n4. Submit application",
                "Applying is easy! Just find a job you like and click Apply Now."
            ],
            company: [
                "To register your company:\n1. Go to Company Registration\n2. Fill company details\n3. Upload business license\n4. Submit for verification",
                "Companies can post jobs after verification. Register your company to get started!"
            ],
            interview: [
                "Interview tips:\n• Research the company\n• Prepare your answers\n• Dress professionally\n• Arrive on time\n• Ask questions",
                "Good luck with your interview! Remember to be confident and prepared."
            ],
            salary: [
                "Salary ranges in Ethiopia vary by industry:\n• IT: ETB 15,000 - 50,000\n• Finance: ETB 10,000 - 35,000\n• Healthcare: ETB 8,000 - 25,000\n• Education: ETB 6,000 - 20,000",
                "Salaries depend on experience, education, and industry."
            ],
            default: [
                "I can help you with:\n\n💼 Finding jobs\n📄 Resume creation\n🏢 Company registration\n📝 Job applications\n📅 Interview tips\n💰 Salary information",
                "I'm here to help! Ask me about jobs, resumes, companies, or interviews."
            ]
        };
    }
    
    generateResponse(message) {
        const msg = message.toLowerCase();
        
        if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey') || msg.includes('selam')) {
            return this.randomResponse('greeting');
        }
        if (msg.includes('job') || msg.includes('work') || msg.includes('vacancy') || msg.includes('ስራ')) {
            return this.randomResponse('jobs');
        }
        if (msg.includes('resume') || msg.includes('cv') || msg.includes('ማህደር')) {
            return this.randomResponse('resume');
        }
        if (msg.includes('apply') || msg.includes('application') || msg.includes('ማመልከት')) {
            return this.randomResponse('apply');
        }
        if (msg.includes('company') || msg.includes('employer') || msg.includes('ኩባንያ') || msg.includes('register')) {
            return this.randomResponse('company');
        }
        if (msg.includes('interview') || msg.includes('ቃለ')) {
            return this.randomResponse('interview');
        }
        if (msg.includes('salary') || msg.includes('pay') || msg.includes('ደመወዝ') || msg.includes('etb')) {
            return this.randomResponse('salary');
        }
        
        return this.randomResponse('default');
    }
    
    randomResponse(category) {
        const responses = this.responses[category] || this.responses.default;
        return responses[Math.floor(Math.random() * responses.length)];
    }
}

module.exports = new AIBotService();
