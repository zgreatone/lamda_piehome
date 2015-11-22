/**
 * This sample demonstrates a simple driver  built against the Alexa Lighting Api.
 * For additional details, please refer to the Alexa Lighting API developer documentation
 * https://developer.amazon.com/public/binaries/content/assets/html/alexa-lighting-api.html
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
    path: '/alexa_light?api_key=' + homeApiKey,
    method: 'GET',
    headers: {},
    rejectUnauthorized: false
};
var REMOTE_CLOUD_BASE_PATH = '/';
var REMOTE_CLOUD_HOSTNAME = 'www.amazon.com';

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
function handleDiscovery(accessToken, context) {

    /**
     * Crafting the response header
     */
    var headers = {
        namespace: 'Discovery',
        name: 'DiscoverAppliancesResponse',
        payloadVersion: '1'
    };

    /**
     * Response body will be an array of discovered devices.
     */
    var appliances = [];

    var applianceDiscovered = {
        applianceId: 'Sample-Device-ID',
        manufacturerName: 'SmartThings',
        modelName: 'ST01',
        version: 'VER01',
        friendlyName: 'Sample Name',
        friendlyDescription: 'the light in kitchen',
        isReachable: true,
        additionalApplianceDetails: {
            /**
             * OPTIONAL:
             * We can use this to persist any appliance specific metadata.
             * This information will be returned back to the driver when user requests
             * action on this appliance.
             */
            'fullApplianceId': '2cd6b650-c0h0-4062-b31d-7ec2c146c5ea'
        }
    };
    appliances.push(applianceDiscovered);

    /**
     * Craft the final response back to Alexa Connected Home Skill. This will include all the
     * discoverd appliances.
     */
    var payloads = {
        discoveredAppliances: appliances
    };
    var result = {
        header: headers,
        payload: payloads
    };

    log('Discovery', result);

    context.succeed(result);
}

function handleSwitchOnOffRequest(event, context, applianceId, accessToken) {
    /**
     * Make a remote call to execute the action based on accessToken and the applianceId and the switchControlAction
     * Some other examples of checks:
     *    validate the appliance is actually reachable else return TARGET_OFFLINE error
     *    validate the authentication has not expired else return EXPIRED_ACCESS_TOKEN error
     * Please see the technical documentation for detailed list of errors
     */
    var basePath = '';
    if (event.payload.generateError === 'TURN_ON') {
        basePath = REMOTE_CLOUD_BASE_PATH + '/' + applianceId + '/on?access_token=' + accessToken;
    } else if (event.payload.generateError === 'TURN_OFF') {
        basePath = REMOTE_CLOUD_BASE_PATH + '/' + applianceId + '/of?access_token=' + accessToken;
    }

    var options = {
        hostname: REMOTE_CLOUD_HOSTNAME,
        port: 443,
        path: REMOTE_CLOUD_BASE_PATH,
        headers: {
            accept: '*/*'
        }
    };

    var serverError = function (e) {
        log('Error', e.message);
        /**
         * Craft an error response back to Alexa Connected Home Skill
         */
        context.fail(generateError('SwitchOnOffRequest', 'DEPENDENT_SERVICE_UNAVAILABLE', 'Unable to connect to server'));
    };

    var callback = function (response) {
        var str = '';

        response.on('data', function (chunk) {
            str += chunk.toString('utf-8');
        });

        response.on('end', function () {
            /**
             * Test the response from remote endpoint (not shown) and craft a response message
             * back to Alexa Connected Home Skill
             */
            log('done with result');
            var payloads = {
                success: true
            };

            var result = generateSuccess('Control', 'SwitchOnOffResponse', payloads);
            log('Done with result', result);
            context.succeed(result);
        });

        response.on('error', serverError);
    };

    /**
     * Make an HTTPS call to remote endpoint.
     */
    https.get(options, callback)
        .on('error', serverError).end();
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

        /**
         * Retrieve the appliance id and accessToken from the incoming message.
         */
        var applianceId = event.payload.appliance.applianceId;
        var accessToken = event.payload.accessToken.trim();
        log('applianceId', applianceId);

        handleSwitchOnOffRequest(event, context, applianceId, accessToken);
    } else if (event.header.namespace === 'Control' && event.header.name === 'AdjustNumericalSettingRequest') {

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