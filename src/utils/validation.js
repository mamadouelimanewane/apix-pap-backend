import Joi from 'joi';

export const schemas = {
  // Authentication
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required()
  }),

  // PAP
  createPAP: Joi.object({
    nom: Joi.string().required(),
    prenom: Joi.string(),
    dateNaissance: Joi.date(),
    email: Joi.string().email(),
    telephone: Joi.string(),
    adresse: Joi.string(),
    zone: Joi.string().required(),
    secteur: Joi.string()
  }),

  updatePAP: Joi.object({
    nom: Joi.string(),
    prenom: Joi.string(),
    zone: Joi.string(),
    secteur: Joi.string(),
    status: Joi.string().valid(
      'registered',
      'documented',
      'properties_listed',
      'evaluated',
      'compensated',
      'paid',
      'closed'
    ),
    notes: Joi.string()
  }),

  // Bien
  createBien: Joi.object({
    type: Joi.string().valid('maison', 'terrain', 'commerce', 'agricole', 'autre').required(),
    adresse: Joi.string(),
    zone: Joi.string(),
    superficie: Joi.number().positive().required(),
    description: Joi.string()
  }),

  // Evaluation
  createEvaluation: Joi.object({
    date: Joi.date().required(),
    evaluator: Joi.string(),
    estimatedValue: Joi.number().positive().required(),
    condition: Joi.string().valid('bon', 'moyen', 'mauvais').required(),
    details: Joi.string()
  }),

  // Compensation
  proposeCompensation: Joi.object({
    proposedAmount: Joi.number().positive().required(),
    notes: Joi.string()
  }),

  reviewCompensation: Joi.object({
    status: Joi.string().valid('approved', 'rejected').required(),
    reviewedBy: Joi.string().required(),
    notes: Joi.string()
  }),

  // Payment
  initiatePayment: Joi.object({
    amount: Joi.number().positive().required(),
    paymentMethod: Joi.string()
      .valid('wave', 'orangemoney', 'virementbancaire', 'cheque', 'espece')
      .required(),
    reference: Joi.string()
  })
};

export const validate = (schema, data) => {
  const { error, value } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true
  });

  if (error) {
    const details = error.details.map(err => ({
      field: err.path.join('.'),
      message: err.message
    }));
    throw { status: 400, message: 'Validation error', details };
  }

  return value;
};

export const validationMiddleware = (schema) => {
  return (req, res, next) => {
    try {
      req.body = validate(schema, req.body);
      next();
    } catch (error) {
      res.status(error.status || 400).json({
        success: false,
        error
      });
    }
  };
};
