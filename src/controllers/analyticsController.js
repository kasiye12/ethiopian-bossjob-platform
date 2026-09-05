const pool = require('../config/database');
const ApiResponse = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

class AnalyticsController {
    /**
     * Get overall analytics for employer
     */
    getAnalytics = asyncHandler(async (req, res) => {
        const { timeRange = 30 } = req.query;
        
        // Get company for user
        const companyResult = await pool.query(
            'SELECT id FROM companies WHERE owner_id = $1',
            [req.user.id]
        );
        
        if (companyResult.rows.length === 0) {
            throw new AppError('No company found', 404);
        }
        
        const companyId = companyResult.rows[0].id;
        
        // Get job statistics
        const jobStats = await pool.query(
            `SELECT 
                COUNT(*) as total_jobs,
                COUNT(CASE WHEN status = 'active' THEN 1 END) as active_jobs,
                COALESCE(SUM(views_count), 0) as total_views,
                COALESCE(SUM(applications_count), 0) as total_applications,
                ROUND(AVG(views_count), 0) as avg_views_per_job,
                ROUND(AVG(applications_count), 0) as avg_applications_per_job
             FROM jobs
             WHERE company_id = $1
             AND created_at >= NOW() - ($2 || ' days')::INTERVAL`,
            [companyId, timeRange]
        );
        
        // Get application statistics
        const appStats = await pool.query(
            `SELECT 
                COUNT(*) as total_applications,
                COUNT(CASE WHEN status = 'hired' THEN 1 END) as hired,
                COUNT(CASE WHEN status = 'shortlisted' THEN 1 END) as shortlisted,
                COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected,
                COUNT(CASE WHEN status = 'interviewed' THEN 1 END) as interviewed
             FROM applications a
             JOIN jobs j ON a.job_id = j.id
             WHERE j.company_id = $1
             AND a.created_at >= NOW() - ($2 || ' days')::INTERVAL`,
            [companyId, timeRange]
        );
        
        // Calculate hire rate
        const totalApps = parseInt(appStats.rows[0].total_applications) || 0;
        const hired = parseInt(appStats.rows[0].hired) || 0;
        const hireRate = totalApps > 0 ? Math.round((hired / totalApps) * 100) : 0;
        
        // Get daily applications for chart
        const dailyData = await pool.query(
            `SELECT DATE(a.created_at) as date, COUNT(*) as count
             FROM applications a
             JOIN jobs j ON a.job_id = j.id
             WHERE j.company_id = $1
             AND a.created_at >= NOW() - ($2 || ' days')::INTERVAL
             GROUP BY DATE(a.created_at)
             ORDER BY date`,
            [companyId, timeRange]
        );
        
        // Get applications by job
        const jobsBreakdown = await pool.query(
            `SELECT j.title, 
                    COUNT(a.id) as applications,
                    COUNT(CASE WHEN a.status = 'hired' THEN 1 END) as hired
             FROM jobs j
             LEFT JOIN applications a ON j.id = a.job_id
             WHERE j.company_id = $1
             GROUP BY j.id, j.title
             ORDER BY applications DESC
             LIMIT 10`,
            [companyId]
        );
        
        return ApiResponse.success(res, {
            overview: {
                totalJobs: parseInt(jobStats.rows[0].total_jobs) || 0,
                activeJobs: parseInt(jobStats.rows[0].active_jobs) || 0,
                totalViews: parseInt(jobStats.rows[0].total_views) || 0,
                totalApplications: totalApps,
                avgViewsPerJob: parseInt(jobStats.rows[0].avg_views_per_job) || 0,
                avgApplicationsPerJob: parseInt(jobStats.rows[0].avg_applications_per_job) || 0,
                hireRate,
                hired,
                shortlisted: parseInt(appStats.rows[0].shortlisted) || 0,
                interviewed: parseInt(appStats.rows[0].interviewed) || 0,
                rejected: parseInt(appStats.rows[0].rejected) || 0,
            },
            dailyApplications: dailyData.rows,
            jobsBreakdown: jobsBreakdown.rows,
        }, 'Analytics retrieved');
    });

    /**
     * Get interview analytics
     */
    getInterviewAnalytics = asyncHandler(async (req, res) => {
        const { rows } = await pool.query(
            `SELECT 
                COUNT(*) as total_interviews,
                COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
                COUNT(CASE WHEN status = 'scheduled' THEN 1 END) as scheduled,
                COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled,
                COUNT(CASE WHEN status = 'no-show' THEN 1 END) as no_show
             FROM interviews
             WHERE employer_id = $1`,
            [req.user.id]
        );
        
        const total = parseInt(rows[0].total_interviews) || 0;
        const completed = parseInt(rows[0].completed) || 0;
        const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
        
        return ApiResponse.success(res, {
            ...rows[0],
            completionRate,
        }, 'Interview analytics retrieved');
    });

    /**
     * Get talent analytics
     */
    getTalentAnalytics = asyncHandler(async (req, res) => {
        const { rows } = await pool.query(
            `SELECT 
                (SELECT COUNT(*) FROM saved_talents WHERE employer_id = $1) as saved_talents,
                (SELECT COUNT(*) FROM viewed_talents WHERE employer_id = $1) as viewed_talents,
                (SELECT COUNT(DISTINCT talent_id) FROM saved_talents WHERE employer_id = $1) as unique_talents`,
            [req.user.id]
        );
        
        return ApiResponse.success(res, rows[0], 'Talent analytics retrieved');
    });

    /**
     * Get revenue analytics (for admin)
     */
    getRevenueAnalytics = asyncHandler(async (req, res) => {
        const { timeRange = 30 } = req.query;
        
        const { rows } = await pool.query(
            `SELECT 
                COALESCE(SUM(amount), 0) as total_revenue,
                COUNT(*) as total_transactions,
                COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
                COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
                DATE(created_at) as date
             FROM payment_transactions
             WHERE created_at >= NOW() - ($1 || ' days')::INTERVAL
             GROUP BY DATE(created_at)
             ORDER BY date`,
            [timeRange]
        );
        
        const totalRevenue = rows.reduce((sum, r) => sum + parseFloat(r.total_revenue), 0);
        
        return ApiResponse.success(res, {
            totalRevenue,
            dailyBreakdown: rows,
        }, 'Revenue analytics retrieved');
    });
}

module.exports = new AnalyticsController();
