import * as net from "net";
import {Socket} from "net";
import {Global} from "../core/global";
import {SocketHandler} from "../core/socket-handler";
import {WebhookReceivedCallback} from "../server/webhook-manager";
import {WebhookRequest} from "../core/webhook-request";
import {TCPClient} from "./tcp-client";
import {NetworkErrorType} from "../core/global";
import {LoggingHelper} from "../core/logging-helper";
import {KeepAlive} from "./keep-alive";

const Logger = "BST-CLIENT";

/**
 * Handles between the bespoken server and the service running on the local machine
 * Initiates a TCP connection with the server
 */
export class BespokeClient {
    public onConnect: (error?: any) => void = null;
    public onWebhookReceived: WebhookReceivedCallback;
    public onError: (errorType: NetworkErrorType, message: string) => void;

    private keepAlive: KeepAlive;
    private socketHandler: SocketHandler;
    private shuttingDown: boolean = false;

    constructor(public nodeID: string,
                private host: string,
                private port: number,
                private targetPort: number) {}

    public connect(): void {
        let self = this;

        this.socketHandler = SocketHandler.connect(this.host, this.port,
            function(error: any) {
                self.connected(error);
            },

            function(data: string, messageID?: number) {
                self.messageReceived(data, messageID);
            }
        );

        // If the socket gets closed, probably server-side issue
        // We do not do anything in this case other than
        this.socketHandler.onCloseCallback = function() {
            if (!self.shuttingDown) {
                LoggingHelper.error(Logger, "Socket closed by bst server: " + self.host + ":" + self.port);
                LoggingHelper.error(Logger, "Check your network settings - and try connecting again.");
                LoggingHelper.error(Logger, "If the issue persists, contact us at Bespoken:");
                LoggingHelper.error(Logger, "\thttps://gitter.im/bespoken/bst");
                self.shutdown();
            }
        };

        this.onWebhookReceived = function(request: WebhookRequest) {
            let self = this;
            LoggingHelper.info(Logger, "OnWebhook: " + request.toString());

            let tcpClient = new TCPClient(request.id() + "");
            tcpClient.transmit("localhost", self.targetPort, request.toTCP(), function(data: string, error: NetworkErrorType, message: string) {
                if (data != null) {
                    self.socketHandler.send(data, request.id());
                } else if (error !== null && error !== undefined) {
                    if (error === NetworkErrorType.CONNECTION_REFUSED) {
                        LoggingHelper.error(Logger, "CLIENT Connection Refused, Port " + self.targetPort + ". Is your server running?");
                    }

                    if (self.onError != null) {
                        self.onError(error, message);
                    }
                }
            });
        };

        this.keepAlive = this.newKeepAlive(this.socketHandler);
        this.keepAlive.start(function () {
            LoggingHelper.error(Logger, "Socket not communicating with bst server: " + self.socketHandler.remoteEndPoint());
            LoggingHelper.error(Logger, "Check your network settings - and maybe try connecting again.");
            LoggingHelper.error(Logger, "If the issue persists, contact us at Bespoken:");
            LoggingHelper.error(Logger, "\thttps://gitter.im/bespoken/bst");
        });
    }

    // Factory method for testability
    protected newKeepAlive(handler: SocketHandler): KeepAlive {
        return new KeepAlive(handler);
    }

    private connected(error?: any): void {
        if (error !== undefined && error !== null) {
            LoggingHelper.error(Logger, "Unable to connect to: " + this.host + ":" + this.port);
            this.shutdown();
            if (this.onConnect !== undefined && this.onConnect !== null) {
                this.onConnect(error);
            }
        } else {
            LoggingHelper.info(Logger, "Connected - " + this.host + ":" + this.port);
            // As soon as we connect, we send our ID
            let messageJSON = {"id": this.nodeID};
            let message = JSON.stringify(messageJSON);

            this.socketHandler.send(message);
            if (this.onConnect !== undefined  && this.onConnect !== null) {
                this.onConnect();
            }
        }
    }

    private messageReceived (message: string, messageID?: number) {
        // First message we get back is an ack
        if (message.indexOf("ACK") !== -1) {
            // console.log("Client: ACK RECEIVED");
        } else if (message.indexOf(Global.KeepAliveMessage) !== -1) {
            this.keepAlive.received();
        } else {
            this.onWebhookReceived(WebhookRequest.fromString(this.socketHandler.socket, message, messageID));
        }
    }

    public shutdown(callback?: () => void): void {
        LoggingHelper.info(Logger, "Shutting down proxy");

        // We track that we are shutting down because a "close" event is sent to the main socket
        //  We normally print info on close, but not in this case
        this.shuttingDown = true;

        this.keepAlive.stop();

        // Do not disconnect until keep alive has stopped
        //  Otherwise it may try to push data through the socket
        this.socketHandler.disconnect();

        if (callback !== undefined && callback !== null) {
            callback();
        }
    }
}
