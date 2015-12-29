"use strict";

var config = require("../config");

// ----- test data ----- //
var testStartSessionWithInvalidAppId = {
    "session": {
        "new": true,
        "sessionId": "session1234",
        "attributes": {},
        "user": {
            "userId": "user123"
        },
        "application": {
            "applicationId": "invalid"
        }
    },
    "version": "1.0",
    "request": {
        "type": "LaunchRequest",
        "requestId": "request5678"
    }
};

var testStartSession = {
    "session": {
        "new": true,
        "sessionId": "session1234",
        "attributes": {},
        "user": {
            "userId": "user123"
        },
        "application": {
            "applicationId": config.askAppId
        }
    },
    "version": "1.0",
    "request": {
        "type": "LaunchRequest",
        "requestId": "request5678"
    }
};


module.exports = {
    testStartSessionWithInvalidAppId: testStartSessionWithInvalidAppId,
    testStartSession: testStartSession
}