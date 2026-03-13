import Joi from "joi";

const statsSchemas = {
  queryGlobalStats: Joi.object({
    startDate: Joi.date().iso().messages({
      "date.base": "startDate must be a valid date",
      "date.format": "startDate must be in ISO format",
    }),
    endDate: Joi.date().iso().messages({
      "date.base": "endDate must be a valid date",
      "date.format": "endDate must be in ISO format",
    }),
  })
    .and("startDate", "endDate")
    .custom((value, helpers) => {
      if (value.startDate && value.endDate && value.endDate < value.startDate) {
        return helpers.error("date.range");
      }
      return value;
    })
    .messages({
      "object.and": "startDate and endDate must be provided together",
      "date.range": "endDate must be greater than or equal to startDate",
    })
    .unknown(false),
};

export default statsSchemas;
