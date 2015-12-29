"use strict";

var config = require("../config"),
    responseHelper = require("./responseHelper");

var registerIntentHandlers = function (intentHandlers, skillContext) {

    intentHandlers["GetStatus"] = function (intent, session, response) {
        responseHelper.processGetStatusIntent(intent, session, response);
    };

    intentHandlers["GetSensorStatus"] = function (intent, session, response) {
        responseHelper.processGetStatusIntent(intent, session, response);
    };

    intentHandlers["PowerOff"] = function (intent, session, response) {
        responseHelper.processDeviceIntent(intent, session, response);
    };

    intentHandlers["PowerToggle"] = function (intent, session, response) {
        responseHelper.processDeviceIntent(intent, session, response);
    };

    intentHandlers["PowerOn"] = function (intent, session, response) {
        responseHelper.processDeviceIntent(intent, session, response);
    };

    intentHandlers["Arm"] = function (intent, session, response) {
        responseHelper.processDeviceIntent(intent, session, response);
    };

    intentHandlers["DisArm"] = function (intent, session, response) {
        responseHelper.processDeviceIntent(intent, session, response);
    };

    intentHandlers["ActivateScene"] = function (intent, session, response) {
        responseHelper.processSceneIntent(intent, session, response);
    };

    intentHandlers["DeActivateScene"] = function (intent, session, response) {
        responseHelper.processSceneIntent(intent, session, response);
    };

    intentHandlers['AMAZON.HelpIntent'] = function (intent, session, response) {
        responseHelper.getHelp(response);
    };

    intentHandlers['AMAZON.CancelIntent'] = function (intent, session, response) {
        if (skillContext.needMoreHelp) {
            response.tell('Okay.  Whenever you\'re ready, you can start giving points to the players in your game.');
        } else {
            response.tell('');
        }
    };

    intentHandlers['AMAZON.StopIntent'] = function (intent, session, response) {
        if (skillContext.needMoreHelp) {
            response.tell('Okay.  Whenever you\'re ready, you can start giving points to the players in your game.');
        } else {
            response.tell('');
        }
    };
};


exports.register = registerIntentHandlers;