"use strict";

function context(validatorFunction) {
    this.validatorFunction = validatorFunction;
    this.succeed = function (data) {
        this.validatorFunction(data, "SUCCESS");
    };
    this.fail = function (data) {
        this.validatorFunction(data, "FAILURE");
    };
}

module.exports = {
    context: context
}