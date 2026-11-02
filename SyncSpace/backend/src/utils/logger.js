'use strict';

const winston = require('winston');
const path = require('path');

const { combine, timestamp, errors, json, colorize, simple } = winston.format;

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    errors({ stack: true }),
    timestamp(),
    json()
  ),
  transports: [
    new winston.transports.Console({
      format: process.env.NODE_ENV === 'production'
        ? combine(errors({ stack: true }), timestamp(), json())
        : combine(colorize(), simple()),
    }),
  ],
  // Avoid logging document content
  silent: process.env.NODE_ENV === 'test',
});

module.exports = logger;
