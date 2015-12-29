"use strict";

var config = require("./config");

var APP_ID = config.askAppId;


var PieHome = require('./src/PieHome');

exports.handler = function (event, context) {
    var pieHome = new PieHome(APP_ID);
    pieHome.execute(event, context);
};
