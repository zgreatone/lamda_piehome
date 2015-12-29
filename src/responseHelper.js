"use strict";

var config = require("../config"),
    AlexaSkill = require('./AlexaSkill'),
    https = require("https"),
    querystring = require('querystring');

var responseHelper = (function () {

    return {

        /**
         * Function to handle the onLaunch skill behavior
         */
        getWelcomeResponse: function (response) {
            var cardTitle = "PieHome Automation Skill!";
            var speechOutput = "Welcome to the Pie Home Automation skills kit. "
                + "You can ask for help, or make a device command request and example would be, "
                + "Turn Off X Box. What would you like to do?";
            var repromptText = "I didn't get that. Please say help, or make device command request.";
            var cardOutput = "You can ask for help, or make a device command request.";

            response.askWithCard(
                {
                    speech: "<speak>" + speechOutput + "</speak>",
                    type: AlexaSkill.speechOutput.SSML
                },
                {
                    speech: repromptText,
                    type: AlexaSkill.speechOutput.PLAIN_TEXT
                },
                cardTitle,
                cardOutput
            );
        },

        /**
         * function to respond to help on this skill
         */
        getHelp: function (response) {
            var speechOutput = "Here's how to use the Pie Home Automation skills kit: "
                + "you can ask for directions by saying, how to I get to Y, or, "
                + "give me directions to Y via transit. You can configure your default starting "
                + "point, travel preferences, and other things by saying, configure. "
                + "You can also say stop, cancel, or exit at any point to exit. "
                + "Of course, you can always ask for help by saying help";
            var repromptText = "";
            response.ask(
                {
                    speech: speechOutput,
                    type: AlexaSkill.speechOutput.PLAIN_TEXT
                },
                {
                    speech: repromptText,
                    type: AlexaSkill.speechOutput.PLAIN_TEXT
                });
        },

        processQueryResponse: function (intent, session, response, success, httpResponse) {
            console.log("in processGetStatusResponse");
            var cardTitle = intent.name;
            var repromptText = "";
            var sessionAttributes = {};
            var shouldEndSession = false;
            var speechOutput = "";

            if (success) {
                try {
                    var jsonObject = JSON.parse(httpResponse);
                    // If we wanted to initialize the session to have some attributes we could add those here.
                    speechOutput = jsonObject.speechOutput;

                    // If the user either does not reply to the welcome message or says something that is not
                    // understood, they will be prompted again with this text.
                    repromptText = "If you have another request do so now.";
                    shouldEndSession = false;
                } catch (e) {
                    console.log("error when processing data with message " + e.message)
                    speechOutput = "Error when processing Home Automation Data"
                    shouldEndSession = true;
                }

            } else {
                console.log("error message: " + httpResponse);
                speechOutput = "Error when communicating with Home Automation Service";
                shouldEndSession = true;

            }

            if (shouldEndSession) {
                response.tell(speechOutput);
            } else {
                response.ask(speechOutput, repromptText)
            }
        },

        /**
         *
         * @param intent
         * @param session
         * @param response
         */
        processGetStatusIntent: function (intent, session, response) {
            var intentName = intent.name;

            var queryParams = config.connectionOptions;
            queryParams.method = "GET";


            var queryBody = {'intent': intentName};
            this.queryHome(intent, session, response, queryParams, queryBody, this.processQueryResponse);
        },

        /**
         *
         * @param intent
         * @param session
         * @param response
         */
        processDeviceIntent: function (intent, session, response) {
            var intentName = intent.name;

            var device = intent.slots.Device.value;

            var queryParams = config.connectionOptions;
            queryParams.method = "POST";


            var queryBody = {'intent': intentName, 'device': device};
            this.queryHome(intent, session, response, queryParams, queryBody, this.processQueryResponse);
        },

        processSceneIntent: function (intent, session, response) {
            var intentName = intent.name;

            var scene = intent.slots.Scene.value;

            var queryParams = config.connectionOptions;
            queryParams.method = "POST";


            var queryBody = {'intent': intentName, 'scene': scene};
            this.queryHome(intent, session, response, queryParams, queryBody, this.processQueryResponse);
        },

        /**
         * Method used to invoke http request against home automation server with intent parameters
         * @param intent intent
         * @param session session object
         * @param response the Response object
         * @param connectionParams http request parameters
         * @param requestData http request data if needed
         * @param intentCallback
         */
        queryHome: function (intent, session, response, connectionParams, requestData, intentCallback) {

            var postData = "";

            //if post request set headers for body
            if (connectionParams.method == "POST") {

                postData = JSON.stringify(requestData);
                console.log("stringified data :[" + postData + "]")
                var headers = {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Content-Length': postData.length
                };
                connectionParams.headers = headers;
            } else if (connectionParams.method == "GET") {
                //TODO user querystring.stringify here
                Object.keys(requestData).forEach(function (key) {
                    connectionParams.path = connectionParams.path + "&" + key + "=" + requestData[key];
                });
            }

            var serverError = function (e) {
                console.log('ERROR: ' + e.message);
                intentCallback(intent, session, callback, false, e.message);
            };

            var requestCallback = function (res) {
                console.log('request STATUS: ' + res.statusCode);
                var statusCode = res.statusCode;

                var output = '';

                console.log(connectionParams.host + ':' + res.statusCode);
                res.setEncoding('utf8');

                // Buffer the body entirely for processing as a whole.
                res.on('data', function (chunk) {
                    output += chunk;
                });

                // ...and/or process the entire body here.
                res.on('end', function () {
                    console.log("successfully completed request.");
                    if (statusCode == 200) {
                        intentCallback(intent, session, response, true, output);
                    } else {
                        intentCallback(intent, session, response, false, output);
                    }
                });

                res.on('error', serverError);
            };

            /**
             * Make an HTTPS call to remote endpoint.
             */
            var req = https.request(connectionParams, requestCallback);

            req.on('error', serverError);

            /**
             * Write data to request if post request
             */
            if (connectionParams.method == "POST") {
                console.log("request is post and post data to be written");
                req.write(postData);
            }
            req.end();
        }
    };
})();
module.exports = responseHelper;