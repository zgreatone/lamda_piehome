"use strict";

var _ = require("underscore");
var util = require('util');
var winston = require('winston');

require('dotenv').config({silent: true});
var ENVDEV = (_.isEmpty(process.env.ENVCONFIG) || process.env.ENVCONFIG === "production") ? false : true;

var logger = new (winston.Logger)({
    transports: [
        new (winston.transports.Console)({
            'timestamp': true,
            'colorize': ENVDEV ? true : false,
            'level': process.env.LOGLEVEL
        })
    ]
});

function formatArgs(args) {
    return [util.format.apply(util.format, Array.prototype.slice.call(args))];
}

console.log = function () {
    logger.info.apply(logger, formatArgs(arguments));
};
console.info = function () {
    logger.info.apply(logger, formatArgs(arguments));
};
console.warn = function () {
    logger.warn.apply(logger, formatArgs(arguments));
};
console.error = function () {
    logger.error.apply(logger, formatArgs(arguments));
};
console.debug = function () {
    logger.debug.apply(logger, formatArgs(arguments));
};


// Connection information to connect to pie home service
var connectionOptions = {
    host: _.isEmpty(process.env.SERVICE_HOST) ? "localhost" : process.env.SERVICE_HOST,
    port: _.isEmpty(process.env.SERVICE_PORT) ? 9432 : process.env.SERVICE_PORT,
    path: '/alexa_skill?api_key=' + _.isEmpty(process.env.SERVICE_API_KEY) ? "notset" : process.env.SERVICE_API_KEY,
    method: 'GET',
    headers: {},
    rejectUnauthorized: false
};

module.exports = {
    env: _.isEmpty(process.env.ENVCONFIG) ? "production" : process.env.ENVCONFIG,
    askAppId: process.env.ASK_APP_ID,
    connectionOptions: connectionOptions
};