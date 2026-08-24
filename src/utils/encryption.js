const crypto = require('crypto');
const config = require('../config');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

class Encryption {
    constructor() {
        this.key = crypto.scryptSync(
            config.encryption.key, 
            'salt', 
            KEY_LENGTH
        );
    }

    encrypt(text) {
        if (!text) return null;
        
        const iv = crypto.randomBytes(IV_LENGTH);
        const salt = crypto.randomBytes(SALT_LENGTH);
        const key = crypto.scryptSync(this.key, salt, KEY_LENGTH);
        
        const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
        const encrypted = Buffer.concat([
            cipher.update(String(text), 'utf8'),
            cipher.final()
        ]);
        
        const tag = cipher.getAuthTag();
        
        return Buffer.concat([salt, iv, tag, encrypted]).toString('base64');
    }

    decrypt(encryptedText) {
        if (!encryptedText) return null;
        
        try {
            const buffer = Buffer.from(encryptedText, 'base64');
            const salt = buffer.slice(0, SALT_LENGTH);
            const iv = buffer.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
            const tag = buffer.slice(
                SALT_LENGTH + IV_LENGTH, 
                SALT_LENGTH + IV_LENGTH + TAG_LENGTH
            );
            const encrypted = buffer.slice(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
            
            const key = crypto.scryptSync(this.key, salt, KEY_LENGTH);
            const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
            decipher.setAuthTag(tag);
            
            return decipher.update(encrypted) + decipher.final('utf8');
        } catch (error) {
            console.error('Decryption error:', error);
            return null;
        }
    }

    hash(text) {
        return crypto.createHash('sha256').update(text).digest('hex');
    }

    generateRandomToken(length = 32) {
        return crypto.randomBytes(length).toString('hex');
    }
}

module.exports = new Encryption();
