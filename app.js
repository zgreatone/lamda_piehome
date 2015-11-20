/**
 * This sample shows how to create a simple Lambda function for handling speechlet requests.
 */
var https = require("https");
var querystring = require('querystring');
var appTag = "HomeAutomation";
var homeApiKey = "piehome";
var verifyApplicationId = true;
var alexaSkillApplicationId = "";

var connectionOptions = {
    host: 'home.zgreatone.net',
    port: 8888,
    path: '/alexa_skill?api_key=' + homeApiKey,
    method: 'GET',
    headers: {},
    rejectUnauthorized: false
};

// Route the incoming request based on type (LaunchRequest, IntentRequest,
// etc.) The JSON body of the request is provided in the event parameter.
exports.handler = function (event, context) {
    try {
        console.log("event.session.application.applicationId=" + event.session.application.applicationId);

        /**
         * Uncomment this if statement and replace application.id with yours
         * to prevent other voice applications from using this function.
         */
        if(verifyApplicationId){
            if (event.session.application.applicationId !== alexaSkillApplicationId) {
                console.log("applicationId="+event.session.application.applicationId+" is NOT valid")
                context.fail("Invalid Application ID");
            }
        }


        if (event.session.new) {
            onSessionStarted({requestId: event.request.requestId}, event.session);
        }

        if (event.request.type === "LaunchRequest") {
            onLaunch(event.request,
                event.session,
                function callback(sessionAttributes, speechletResponse) {
                    context.succeed(buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === "IntentRequest") {
            onIntent(event.request,
                event.session,
                function callback(sessionAttributes, speechletResponse) {
                    context.succeed(buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === "SessionEndedRequest") {
            onSessionEnded(event.request, event.session);

            context.succeed();
        }
    } catch (e) {
        context.fail("Exception: " + e);
    }
};

/**
 * Called when the session starts.
 */
function onSessionStarted(sessionStartedRequest, session) {
    console.log("onSessionStarted requestId=" + sessionStartedRequest.requestId
        + ", sessionId=" + session.sessionId);
}

/**
 * Called when the user launches the app without specifying what they want.
 */
function onLaunch(launchRequest, session, callback) {
    console.log("onLaunch requestId=" + launchRequest.requestId
        + ", sessionId=" + session.sessionId);
    // Dispatch to your skill's launch.
    getWelcomeResponse(callback);
}

/**
 * Called when the user specifies an intent for this application.
 */
function onIntent(intentRequest, session, callback) {
    console.log("onIntent requestId=" + intentRequest.requestId
        + ", sessionId=" + session.sessionId);

    var intent = intentRequest.intent,
        intentName = intentRequest.intent.name;

    console.log("retrieved intent name [" + intentName + "]");
    switch (intentName) {
        case "GetStatus":
        case "GetSensorStatus":
            processGetStatusIntent(intent, session, callback);
            break;
        case "PowerOff":
        case "PowerOn":
        case "PowerToggle":
        case "Arm":
        case "DisArm":
            processDeviceIntent(intent, session, callback);
            break;
        case "ActivateScene":
        case "DeActivateScene":
            processSceneIntent(intent, session, callback);
            break;
        case "NestMode":
            processNestModeIntent(intent, session, callback);
            break;
        case "NestLevel":
            processNestLevelIntent(intent, session, callback);
            break;
        case "NestStatus":
            processNestStatusIntent(intent, session, callback);
            break;
        case "AMAZON.HelpIntent":
            processHelpIntent(intent, session, callback);
            break;
        case "AMAZON.StopIntent":
            processStopIntent(intent, session, callback);
            break;
        case "AMAZON.CancelIntent":
            processCancelIntent(intent, session, callback);
            break;
        default :
            console.log("invalid intent [" + intentName + "]");
            throw "invalid intent";
    }

}


/**
 * Called when the user ends the session.
 * Is not called when the app returns shouldEndSession=true.
 */
function onSessionEnded(sessionEndedRequest, session) {
    console.log("onSessionEnded requestId=" + sessionEndedRequest.requestId
        + ", sessionId=" + session.sessionId);
    // Add cleanup logic here
}

// --------------- Helpers that build all of the responses -----------------------

function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: "PlainText",
            text: output
        },
        card: {
            type: "Simple",
            title: "SessionSpeechlet - " + title,
            content: "SessionSpeechlet - " + output
        },
        reprompt: {
            outputSpeech: {
                type: "PlainText",
                text: repromptText
            }
        },
        shouldEndSession: shouldEndSession
    };
}

function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: "1.0",
        sessionAttributes: sessionAttributes,
        response: speechletResponse
    };
}

// --------------- Functions that control the skill's behavior -----------------------

function getWelcomeResponse(callback) {
    // If we wanted to initialize the session to have some attributes we could add those here.
    var sessionAttributes = {};
    var cardTitle = "Welcome";
    var speechOutput = "Welcome to the Home of Z Great One, "
        + "How may I help you, "
        + "you can ask by saying, "
        + "give me a status check";
    // If the user either does not reply to the welcome message or says something that is not
    // understood, they will be prompted again with this text.
    var repromptText = "Please ask about me about home status by saying, "
        + "give me a status check";
    var shouldEndSession = false;

    callback(sessionAttributes,
        buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}


/**
 * Method used to invoke http request against home automation server with intent parameters
 * @param intent intent
 * @param session session object
 * @param callback callback function for building speechlete response
 * @param connectionParams http request paramters
 * @param requestData http request data if needed
 * @param intentCallback
 */
function queryHome(intent, session, callback, connectionParams, requestData, intentCallback) {

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


    var req = https.request(connectionParams, function (res) {
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
                intentCallback(intent, session, callback, true, output);
            } else {
                intentCallback(intent, session, callback, false, output);
            }
        });
    });

    req.on('error', function (e) {
        console.log('ERROR: ' + e.message);
        intentCallback(intent, session, callback, false, e.message);
    });


    if (connectionParams.method == "POST") {
        console.log("request is post and post data to be written");
        req.write(postData);
    }
    req.end();


    var callback = function(response) {
        var str = '';

        response.on('data', function(chunk) {
            str += chunk.toString('utf-8');
        });

        response.on('end', function() {
            /**
             * Test the response from remote endpoint (not shown) and craft a response message
             * back to Alexa Connected Home Skill
             */
            log('done with result');
            var headers = {
                namespace: 'Control',
                name: 'SwitchOnOffResponse',
                payloadVersion: '1'
            };
            var payloads = {
                success: true
            };
            var result = {
                header: headers,
                payload: payloads
            };
            log('Done with result', result);
            context.succeed(result);
        });

        response.on('error', serverError);
    };
}

/**
 *
 * @param intent
 * @param session
 * @param callback
 * @param success
 * @param response
 */
function processQueryResponse(intent, session, callback, success, response) {
    console.log("in processGetStatusResponse");
    var cardTitle = intent.name;
    var repromptText = "";
    var sessionAttributes = {};
    var shouldEndSession = false;
    var speechOutput = "";

    if (success) {
        try {
            var jsonObject = JSON.parse(response);
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
        console.log("error message: " + response);
        speechOutput = "Error when communicating with Home Automation Service";
        shouldEndSession = true;

    }

    callback(sessionAttributes,
        buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

// ---------------------------- GetStatus -----------------------------------------
/**
 *
 * @param intent
 * @param session
 * @param callback
 */
function processGetStatusIntent(intent, session, callback) {
    var intentName = intent.name;

    var queryParams = connectionOptions;
    queryParams.method = "GET";


    var queryBody = {'intent': intentName};
    queryHome(intent, session, callback, queryParams, queryBody, processQueryResponse);
}

// ---------------------------- ProcessDevice -----------------------------------------
/**
 *
 * @param intent
 * @param session
 * @param callback
 */
function processDeviceIntent(intent, session, callback) {
    var intentName = intent.name;

    var device = intent.slots.Device.value;

    var queryParams = connectionOptions;
    queryParams.method = "POST";


    var queryBody = {'intent': intentName, 'device': device};
    queryHome(intent, session, callback, queryParams, queryBody, processQueryResponse);
}


// ---------------------------- ProcessScene -----------------------------------------
/**
 *
 * @param intent
 * @param session
 * @param callback
 */
function processSceneIntent(intent, session, callback) {
    var intentName = intent.name;

    var scene = intent.slots.Scene.value;

    var queryParams = connectionOptions;
    queryParams.method = "POST";


    var queryBody = {'intent': intentName, 'scene': scene};
    queryHome(intent, session, callback, queryParams, queryBody, processQueryResponse);
}

// ---------------------------- NestMode -----------------------------------------
/**
 *
 * @param intent
 * @param session
 * @param callback
 */
function processNestModeIntent(intent, session, callback) {
    var intentName = intent.name;

    var mode = intent.slots.Mode.value;

    var queryParams = connectionOptions;
    queryParams.method = "POST";


    var queryBody = {'intent': intentName, 'mode': mode};
    queryHome(intent, session, callback, queryParams, queryBody, processQueryResponse);
}


// ---------------------------- NestLevel -----------------------------------------
/**
 *
 * @param intent
 * @param session
 * @param callback
 */
function processNestLevelIntent(intent, session, callback) {
    var intentName = intent.name;

    var level = intent.slots.Level.value;

    var queryParams = connectionOptions;
    queryParams.method = "POST";


    var queryBody = {'intent': intentName, 'level': level};
    queryHome(intent, session, callback, queryParams, queryBody, processQueryResponse);
}

// ---------------------------- NestStatus -----------------------------------------
/**
 *
 * @param intent
 * @param session
 * @param callback
 */
function processNestStatusIntent(intent, session, callback) {
    var intentName = intent.name;

    var status = intent.slots.Status.value;

    var queryParams = connectionOptions;
    queryParams.method = "POST";


    var queryBody = {'intent': intentName, 'status': status};
    queryHome(intent, session, callback, queryParams, queryBody, processQueryResponse);
}

// ---------------------------- Stop ----------------------------------------------------
/**
 *
 * @param intent
 * @param session
 * @param callback
 */
function processStopIntent(intent, session, callback) {
    // If we wanted to initialize the session to have some attributes we could add those here.
    var sessionAttributes = {};
    var cardTitle = "End";
    var speechOutput = "Goodbye ";
    // If the user either does not reply to the welcome message or says something that is not
    // understood, they will be prompted again with this text.
    var repromptText = "";
    var shouldEndSession = true;

    callback(sessionAttributes,
        buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

// ---------------------------- Help ----------------------------------------------------
/**
 *
 * @param intent
 * @param session
 * @param callback
 */
function processHelpIntent(intent, session, callback) {
    // If we wanted to initialize the session to have some attributes we could add those here.
    var sessionAttributes = {};
    var cardTitle = "End";
    var speechOutput = "Goodbye ";
    // If the user either does not reply to the welcome message or says something that is not
    // understood, they will be prompted again with this text.
    var repromptText = "";
    var shouldEndSession = true;

    callback(sessionAttributes,
        buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

// ---------------------------- Cancel ----------------------------------------------------
/**
 *
 * @param intent
 * @param session
 * @param callback
 */
function processCancelIntent(intent, session, callback) {
    // If we wanted to initialize the session to have some attributes we could add those here.
    var sessionAttributes = {};
    var cardTitle = "End";
    var speechOutput = "Goodbye ";
    // If the user either does not reply to the welcome message or says something that is not
    // understood, they will be prompted again with this text.
    var repromptText = "";
    var shouldEndSession = true;

    callback(sessionAttributes,
        buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}