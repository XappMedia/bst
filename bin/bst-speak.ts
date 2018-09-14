#!/usr/bin/env node
import * as program from "commander";
import {Global} from "../lib/core/global";
import {VirtualDeviceClient} from "../lib/external/virtual-device";
import {BstStatistics, BstCommand} from "../lib/statistics/bst-statistics";

program.version(Global.version());

Global.initializeCLI().then(
    () => {
        program
            .usage("[options] <utterance>")
            .option("-l, --locale <locale>", "The locale to use for the virtual device (en-US, en-GB, de-DE, etc.)")
            .option("-t, --token <token>", `The token for interacting with your virtual device - get it here:

        \thttps://${Global.SpokesDashboardHost}/skills/${Global.config().sourceID()}/validation
        \t(Bespoken Dashboard account required for use of this feature)\n`)
            .option("-v, --voiceID <voiceID>", "The AWS Polly voice ID to use for generating speech")
            .description("Speaks to your virtual Alexa device")
            .action(async function () {
                // To handle utterances with multiple words, we need to look at the args
                let utterance: string = "";
                for (let i = 0; i < program.args.length; i++ ) {
                    let arg = program.args[i];
                    if (typeof arg !== "string") {
                        break;
                    }

                    if (utterance.length > 0) {
                        utterance += " ";
                    }
                    utterance += arg;
                }

                // Just by casting program to options, we can get all the options which are set on it
                const options: any = program;
                const token = options.token;
                const locale = options.locale;
                const voiceID = options.voiceID;

                let virtualDeviceResponse;
                try {
                    virtualDeviceResponse = await VirtualDeviceClient.speak(utterance, token, locale, voiceID);
                } catch (error) {
                    if (error.message === "Token Required") {
                        console.log("You need a token for this option to work, get it here:");
                        console.log();
                        console.log("\thttps://" + Global.SpokesDashboardHost + "/skills/" + Global.config().sourceID() + "/validation");
                        console.log("\t(Bespoken Dashboard account required for use of this feature)");
                        console.log();
                        console.log("Then try again with:");
                        console.log();
                        console.log("\tbst speak --token <ProvidedToken> <Speech to try>");
                        console.log();
                        process.exit(0);
                        return;
                    }
                    // Different issue, we throw to be catch by the general error handler.
                    throw error;
                }

                if (token) {
                    console.log("Your token is saved, you can now use this command without providing a token");
                }
                let nodeId = undefined;
                if (Global.config() && Global.config().secretKey && Global.config().secretKey()) {
                    nodeId = Global.config().secretKey();
                }
                BstStatistics.instance().record(BstCommand.speak, undefined, nodeId);
                console.log(VirtualDeviceClient.renderResult(virtualDeviceResponse));
            });


        // Forces help to be printed
        if (process.argv.slice(2).length === 0) {
            program.outputHelp();
        } else {
            program.parse(process.argv);
        }
    }
);