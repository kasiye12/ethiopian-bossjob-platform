require('dotenv').config();

module.exports = {
    env: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 3000,
    host: process.env.HOST || '0.0.0.0',
    
    database: {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        name: process.env.DB_NAME || 'bossjob_ethiopia',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
    },
    
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD,
    },
    
    jwt: {
        secret: process.env.JWT_SECRET || 'dev-secret',
        expiry: process.env.JWT_EXPIRY || '7d',
        refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '30d',
    },
    
    fayda: {
        apiUrl: process.env.FAYDA_API_URL,
        apiKey: process.env.FAYDA_API_KEY,
        apiSecret: process.env.FAYDA_API_SECRET,
    },
    
    telegram: {
        botToken: process.env.TELEGRAM_BOT_TOKEN,
        channelId: process.env.TELEGRAM_CHANNEL_ID,
    },
    
    telebirr: {
        appId: process.env.TELEBIRR_APP_ID,
        appKey: process.env.TELEBIRR_APP_KEY,
        apiUrl: process.env.TELEBIRR_API_URL,
        publicKey: process.env.TELEBIRR_PUBLIC_KEY,
    },
    
    chapa: {
        apiKey: process.env.CHAPA_API_KEY,
        apiUrl: process.env.CHAPA_API_URL,
    },
    
    sms: {
        apiUrl: process.env.SMS_API_URL,
        apiKey: process.env.SMS_API_KEY,
        senderId: process.env.SMS_SENDER_ID,
    },
    
    aws: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.AWS_REGION || 'af-south-1',
        bucketName: process.env.AWS_BUCKET_NAME,
    },
    
    encryption: {
        key: process.env.ENCRYPTION_KEY,
    },
    
    bcrypt: {
        saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12,
    },
    
    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
        max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    },
    
    smtp: {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
};
