const Joi = require('joi');
const AppError = require('../utils/AppError');

const validate = (schema, property = 'body') => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req[property], {
            abortEarly: false,
            stripUnknown: true,
        });
        
        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message,
            }));
            
            return next(new AppError('Validation Error', 400, errors));
        }
        
        req[property] = value;
        next();
    };
};

module.exports = validate;
