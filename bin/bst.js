#!/usr/bin/env node
"use strict";
const bespoke_client_1 = require("../lib/client/bespoke-client");
const arg_helper_1 = require("../lib/core/arg-helper");
const global_1 = require("../lib/core/global");
const url_mangler_1 = require("../lib/client/url-mangler");
const lambda_client_1 = require("../lib/client/lambda-client");
global_1.Global.initialize();
let argHelper = new arg_helper_1.ArgHelper(process.argv);
if (argHelper.orderedCount() === 0) {
    console.error("No command specified. Must be first argument.");
    process.exit(1);
}
let command = argHelper.forIndex(0);
if (command === "debug") {
    if (argHelper.orderedCount() < 2) {
        console.error("For debug, must specify agent-id and port to forward to!");
        process.exit(1);
    }
    let agentID = argHelper.forIndex(1);
    let targetPort = parseInt(argHelper.forIndex(2));
    let serverHost = argHelper.forKeyWithDefaultString("serverHost", global_1.Global.BespokeServerHost);
    let serverPort = argHelper.forKeyWithDefaultNumber("serverPort", 5000);
    let bespokeClient = new bespoke_client_1.BespokeClient(agentID, serverHost, serverPort, targetPort);
    bespokeClient.connect();
}
if (command === "sleep") {
    console.error("Not until Brooklyn!");
    process.exit(1);
}
if (command === "debug-url") {
    let agentID = argHelper.forIndex(1);
    let url = argHelper.forIndex(2);
    let mangler = new url_mangler_1.URLMangler(url, agentID);
    let newUrl = mangler.mangle();
    console.log("");
    console.log("Use this URL in the Alexa Skills configuration:");
    console.log("");
    console.log("   " + newUrl);
    console.log("");
}
if (command === "help") {
    console.log("");
    console.log("Usage: bst <command>");
    console.log("");
    console.log("Commands:");
    console.log("bst debug <agent-id> <service-port>        Forwards traffic from Alexa to your local Skill service, listening on <service-port>");
    console.log("bst debug-url <agent-id> <alexa-url>       Takes a normal URL and modifies to include the <agent-id> in the query string");
    console.log("");
}
if (command === "lambda-package") {
    let lambdaClient = new lambda_client_1.LambdaClient();
    lambdaClient.pack();
}
if (command === "lambda-deploy") {
    let lambdaClient = new lambda_client_1.LambdaClient();
    lambdaClient.deploy();
}
//# sourceMappingURL=bst.js.map