"use strict";

var _ = require("underscore");
var app = require("../index");
var config = require("../config");
var helper = require("./helper");
var testData = require("./testData");


describe("Pie Home Alexa Lambda Function", function () {
    it("should throw exception", function (done) {

        var validatorFunction = function (data, resp) {
            if (resp === "SUCCESS") {
                throw "onSessionStarted: should not be successful.";
            } else {
                expect(data).toBe("Invalid applicationId");
            }
            done();
        };

        app.handler(testData.testStartSessionWithInvalidAppId, new helper.context(validatorFunction));


    });
});
