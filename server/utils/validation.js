import Joi from 'joi';

export const candidateUpdateSchema = Joi.object({
  name: Joi.string().trim().max(100).optional(),
  email: Joi.string().email().trim().lowercase().optional(),
  phone: Joi.string().trim().max(20).optional(),
  status: Joi.string().valid('new', 'emailed', 'invalid', 'responded').optional(),
  notes: Joi.string().max(500).allow('').optional()
});

export const validateCandidateUpdate = (data) => {
  return candidateUpdateSchema.validate(data, { stripUnknown: true });
};