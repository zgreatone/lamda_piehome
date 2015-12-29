'use strict';

var AlexaSkill = require('./AlexaSkill'),
    eventHandlers = require('./eventHandlers'),
    intentHandlers = require('./intentHandlers');


var skillContext = {};


var PieHome = function (appId) {
    AlexaSkill.call(this, appId);
};


// Extend AlexaSkill
PieHome.prototype = Object.create(AlexaSkill.prototype);
PieHome.prototype.constructor = PieHome;


eventHandlers.register(PieHome.prototype.eventHandlers, skillContext);
intentHandlers.register(PieHome.prototype.intentHandlers, skillContext);

module.exports = PieHome;