const mongoose = require('mongoose');
const Joi = require('joi');

const ratingsSchema = new mongoose.Schema({
    communication: { type: Number, required: true },
    teamwork: { type: Number, required: true },
    technicalSkills: { type: Number, required: true },
    punctuality: { type: Number, required: true }
  }, { _id: false });
  
  const performanceReviewSchema = new mongoose.Schema({
    employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    reviewPeriodStart: { type: Date, required: true },
    reviewPeriodEnd: { type: Date, required: true },
    reviewDate: { type: Date, required: true },
    reviewerId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    ratings: { type: ratingsSchema, required: true },
    comments: { type: String, required: true }
  });
  
const PerformanceReview = mongoose.model('PerformanceReview', performanceReviewSchema);

const ratingsValidation = Joi.object({
  communication: Joi.number().required().label('Communication'),
  teamwork: Joi.number().required().label('Teamwork'),
  technicalSkills: Joi.number().required().label('Technical Skills'),
  punctuality: Joi.number().required().label('Punctuality')
});

const performanceReviewValidation = Joi.object({
  employee: Joi.string().required().regex(/^[0-9a-fA-F]{24}$/).label('Employee ID'),
  reviewPeriodStart: Joi.date().required().label('Review Period Start'),
  reviewPeriodEnd: Joi.date().required().label('Review Period End'),
  reviewDate: Joi.date().required().label('Review Date'),
  reviewerId: Joi.string().required().regex(/^[0-9a-fA-F]{24}$/).label('Reviewer ID'),
  ratings: ratingsValidation.required().label('Ratings'),
  comments: Joi.string().required().label('Comments')
});

module.exports = { 
    PerformanceReview,
    performanceReviewValidation
};
