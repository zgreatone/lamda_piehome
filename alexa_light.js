/**
 * This sample demonstrates a simple driver  built against the Alexa Lighting Api.
 * For additional details, please refer to the Alexa Lighting API developer documentation
 * https://developer.amazon.com/public/binaries/content/assets/html/alexa-lighting-api.html
 */
var https = require("https");
var querystring = require('querystring');
var appTag = "HomeAutomation";
var homeApiKey = "piehome";

var connectionOptions = {
    host: 'home.zgreatone.net',
    port: 8888,
    path: '/alexa_light?api_key=' + homeApiKey,
    method: 'GET',
    headers: {},
    rejectUnauthorized: false
};

/**
 * Main entry point.
 * Incoming events from Alexa Lighting APIs are processed via this method.
 */
exports.handler = function (event, context) {

    log('Input', event);

    switch (event.header.namespace) {

    /**
     * The namespace of "Discovery" indicates a request is being made to the lambda for
     * discovering all appliances associated with the customer's appliance cloud account.
     * can use the accessToken that is made available as part of the payload to determine
     * the customer.
     */
        case 'Discovery':
            handleDiscovery(event, context);
            break;

    /**
     * The namespace of "Control" indicates a request is being made to us to turn a
     * given device on, off or brighten. This message comes with the "appliance"
     * parameter which indicates the appliance that needs to be acted on.
     */
        case 'Control':
            handleControl(event, context);
            break;


    /**
     * The namespace of "System" indicates a request is being made to us to check
     * status of system.
     */
        case 'System':
            handleSystem(event, context);
            break;


    /**
     * We received an unexpected message
     */
        default:
            log('Err', 'No supported namespace: ' + event.header.namespace);
            context.fail('Something went wrong');
            break;
    }
};

/**
 * This method is invoked when we receive a "Discovery" message from Alexa Connected Home Skill.
 * We are expected to respond back with a list of appliances that we have discovered for a given
 * customer.
 */
function handleDiscovery(event, context) {

    var accessToken = event.payload.accessToken.trim();

    var queryParams = connectionOptions;
    queryParams.method = "GET";


    queryHome(accessToken, queryParams, event, context, function (event, context, output) {

        var jsonObject = JSON.parse(output);

        /**
         * Response body will be an array of discovered devices.
         */
        var appliances = jsonObject.appliances;

        /**
         * Craft the final response back to Alexa Connected Home Skill. This will include all the
         * discoverd appliances.
         */
        var payloads = {
            discoveredAppliances: appliances
        };

        var result = generateSuccess('Discovery', 'DiscoverAppliancesResponse', payloads)

        log('Discovery', result);

        context.succeed(result);
    });


}


/**
 * Control events are processed here.
 * This is called when Alexa requests an action (IE turn off appliance).
 */
function handleControl(event, context) {

    /**
     * Fail the invocation if the header is unexpected. This example only demonstrates
     * turn on / turn off, hence we are filtering on anything that is not SwitchOnOffRequest.
     */
    if (event.header.namespace != 'Control' || event.header.name != 'SwitchOnOffRequest') {
        context.fail(generateError('SwitchOnOffRequest', 'UNSUPPORTED_OPERATION', 'Unrecognized operation'));
    }

    /**
     * Fail the invocation if the header is unexpected. This example only demonstrates
     * turn on / turn off, hence we are filtering on anything that is not SwitchOnOffRequest.
     */
    if (event.header.namespace != 'Control' || event.header.name != 'AdjustNumericalSettingRequest') {
        context.fail(generateError('AdjustNumericalSettingRequest', 'UNSUPPORTED_OPERATION', 'Unrecognized operation'));
    }

    if (event.header.namespace === 'Control' && event.header.name === 'SwitchOnOffRequest') {
        handleControlRequest('SwitchOnOffResponse', event, context);
    } else if (event.header.namespace === 'Control' && event.header.name === 'AdjustNumericalSettingRequest') {
        handleControlRequest('AdjustNumericalSettingResponse', event, context);

    }
}

/**
 * Control events are processed here.
 * This is called when Alexa requests an action (IE turn off appliance).
 */
function handleSystem(event, context) {

    /**
     * Fail the invocation if the header is unexpected. This example only demonstrates
     * turn on / turn off, hence we are filtering on anything that is not SwitchOnOffRequest.
     */
    if (event.header.namespace != 'System' || event.header.name != 'HealthCheckRequest') {
        context.fail(generateError('HealthCheckRequest', 'UNSUPPORTED_OPERATION', 'Unrecognized operation'));
    }

    /**
     * Test the response from remote endpoint (not shown) and craft a response message
     * back to Alexa Connected Home Skill
     */
    log('done with result');
    var payloads = {
        isHealthy: true,
        "description": "The system is currently healthy"
    };

    var result = generateSuccess('System', 'HealthCheckResponse', payloads);
    log('Done with result', result);
    context.succeed(result);

}


function handleControlRequest(responseName, event, context) {

    var accessToken = event.payload.accessToken.trim();

    var queryParams = connectionOptions;
    queryParams.method = "POST";


    queryHome(accessToken, queryParams, event, context, function (event, context, output) {

        var jsonObject = JSON.parse(output);
        /**
         * Test the response from remote endpoint (not shown) and craft a response message
         * back to Alexa Connected Home Skill
         */
        log('done with result');
        var payloads = {
            success: true
        };

        var result = generateSuccess('Control', responseName, payloads);
        log('Done with result', result);
        context.succeed(result);
    });
}

function handleRequestError(event, context, message, statusCode) {
    log('Error', message);
    if (statusCode == 500) {
        context.fail(generateError(event.header.namespace, event.header.name,
            'DEPENDENT_SERVICE_UNAVAILABLE', 'Unable to connect to server'));
    } else {
        var jsonObject = JSON.parse(message);
        /**
         * Craft an error response back to Alexa Connected Home Skill
         */
        context.fail(generateError(event.header.namespace, event.header.name,
            'DEPENDENT_SERVICE_UNAVAILABLE', 'Unable to connect to server'));
    }
}

/**
 *
 * @param accessToken
 * @param connectionParams
 * @param event
 * @param context
 * @param callback
 */
function queryHome(accessToken, connectionParams, event, context, callback) {
    var requestData = event
    var postData = "";

    /* add access token to url */
    connectionParams.path = connectionParams.path + "&" + "access_token" + "=" + accessToken;

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
        connectionParams.path = connectionParams.path + "&" + 'namespace' + "=" + event.header.namespace;
        connectionParams.path = connectionParams.path + "&" + 'name' + "=" + event.header.name;
    }

    var serverError = function (e) {
        console.log('ERROR: ' + e.message);
        handleRequestError(event, context, e.message, 500);
    };

    var requestCallback = function (response) {
        console.log('request STATUS: ' + response.statusCode);
        var statusCode = response.statusCode;

        var output = '';

        console.log(connectionParams.host + ':' + response.statusCode);
        response.setEncoding('utf8');

        // Buffer the body entirely for processing as a whole.
        response.on('data', function (chunk) {
            output += chunk;
        });

        // ...and/or process the entire body here.
        response.on('end', function () {
            console.log("successfully completed request.");
            if (statusCode == 200) {
                callback(event, context, output);
            } else {
                handleRequestError(event, context, output, statusCode);
            }
        });

        response.on('error', serverError);
    };

    /**
     * Make an HTTPS call to remote endpoint.
     */
    var request = https.request(connectionParams, requestCallback);

    request.on('error', serverError);

    /**
     * Write data to request if post request
     */
    if (connectionParams.method == "POST") {
        console.log("request is post and post data to be written");
        request.write(postData);
    }
    request.end();
}

/**
 * Utility functions.
 */
function log(title, msg) {
    console.log('*************** ' + title + ' *************');
    console.log(msg);
    console.log('*************** ' + title + ' End*************');
}

function generateHeaders(namespace, name) {
    /**
     * Crafting the response header
     */
    var headers = {
        namespace: namespace,
        name: name,
        payloadVersion: '1'
    };

    return headers
}

function generateError(namespace, name, code, description) {

    var headers = generateHeaders(namespace, name);

    var payload = {
        exception: {
            code: code,
            description: description
        }
    };

    var result = {
        header: headers,
        payload: payload
    };

    return result;
}

function generateSuccess(namespace, name, payload) {

    var headers = generateHeaders(namespace, name);

    var result = {
        header: headers,
        payload: payload
    };

    return result;
}