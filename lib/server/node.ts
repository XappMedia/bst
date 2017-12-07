import {SocketHandler} from "../core/socket-handler";
import {WebhookRequest} from "../core/webhook-request";
import {LoggingHelper} from "../core/logging-helper";

const Logger = "NODE";

export class Node {
    private requests: {[id: number]: WebhookRequest} = {};

    constructor(public id: string, public socketHandler: SocketHandler) {}

    public forward(request: WebhookRequest): void {
        console.log("NODE " + this.id + " MSG-ID: " + request.id() + " Forwarding");
        this.requests[request.id()] = request;
        this.socketHandler.send(request.toTCP(), request.id());
    }

    public handlingRequest(): boolean {
        return (Object.keys(this.requests).length > 0);
    }

    public onReply(message: string | Buffer, messageID: number): void {
        const self = this;
        console.log("NODE " + this.id + " MSG-ID: " + messageID + " ReplyReceived");

        const request = this.requests[messageID];
        if (request === null) {
            LoggingHelper.info(Logger, "No matching messageID for reply: " + messageID);
        } else {
            delete self.requests[messageID];
            try {
                request.sourceSocket.write(message);
            } catch (e) {
                LoggingHelper.error(Logger, "Error writing: " + e);
            }

        }

    }
}