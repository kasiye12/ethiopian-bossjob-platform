const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const pool = require('../config/database');

class CVGenerator {
    async generateCV(userId) {
        try {
            // Get user and profile data
            const userResult = await pool.query(
                'SELECT * FROM users WHERE id = $1',
                [userId]
            );
            
            const profileResult = await pool.query(
                'SELECT * FROM candidate_profiles WHERE user_id = $1',
                [userId]
            );
            
            if (userResult.rows.length === 0) {
                throw new Error('User not found');
            }
            
            const user = userResult.rows[0];
            const profile = profileResult.rows[0] || {};
            
            // Create PDF
            const doc = new PDFDocument({
                size: 'A4',
                margin: 50,
            });
            
            const fileName = `CV_${user.full_name.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
            const filePath = path.join(__dirname, '../../uploads/resumes', fileName);
            
            doc.pipe(fs.createWriteStream(filePath));
            
            // Header
            doc.fontSize(24)
               .font('Helvetica-Bold')
               .text(user.full_name, { align: 'center' });
            
            doc.fontSize(12)
               .font('Helvetica')
               .text(profile.profession_title || '', { align: 'center' });
            
            doc.moveDown();
            doc.fontSize(10)
               .text(`📞 ${user.phone_number}  |  ✉️ ${user.email || 'N/A'}  |  📍 ${profile.current_location || 'Ethiopia'}`, { align: 'center' });
            
            doc.moveDown(2);
            
            // Professional Summary
            if (profile.summary) {
                doc.fontSize(14).font('Helvetica-Bold').text('PROFESSIONAL SUMMARY');
                doc.moveDown(0.5);
                doc.fontSize(10).font('Helvetica').text(profile.summary);
                doc.moveDown(2);
            }
            
            // Skills
            if (profile.skills && profile.skills.length > 0) {
                doc.fontSize(14).font('Helvetica-Bold').text('SKILLS');
                doc.moveDown(0.5);
                doc.fontSize(10).font('Helvetica').text(profile.skills.join(', '));
                doc.moveDown(2);
            }
            
            // Experience
            doc.fontSize(14).font('Helvetica-Bold').text('EXPERIENCE');
            doc.moveDown(0.5);
            doc.fontSize(10).font('Helvetica')
               .text(`${profile.years_of_experience || 0} years of experience`);
            doc.moveDown(2);
            
            // Education
            doc.fontSize(14).font('Helvetica-Bold').text('EDUCATION');
            doc.moveDown(0.5);
            doc.fontSize(10).font('Helvetica')
               .text(profile.education_level || 'Not specified');
            doc.moveDown(2);
            
            // Languages
            doc.fontSize(14).font('Helvetica-Bold').text('LANGUAGES');
            doc.moveDown(0.5);
            doc.fontSize(10).font('Helvetica')
               .text('Amharic (Native), English (Professional)');
            
            doc.end();
            
            // Update profile with CV URL
            await pool.query(
                'UPDATE candidate_profiles SET cv_url = $1 WHERE user_id = $2',
                [`/uploads/resumes/${fileName}`, userId]
            );
            
            return {
                fileName,
                filePath,
                url: `/uploads/resumes/${fileName}`,
            };
            
        } catch (error) {
            console.error('Error generating CV:', error);
            throw error;
        }
    }
}

module.exports = new CVGenerator();
