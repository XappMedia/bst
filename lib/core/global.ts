import {LoggingHelper} from "./logging-helper";
import {BSTConfig} from "../client/bst-config";
import {BSTProcess} from "../client/bst-config";

export class Global {
    public static MessageDelimiter = "4772616365";
    public static MessageIDLength = 13;
    public static KeepAliveMessage = "KEEPALIVE";
    public static BespokeServerHost = "proxy.bespoken.tools";
    public static SpokesPipeDomain = "bespoken.link";
    public static SpokesDashboardHost = "apps.bespoken.io";

    private static _configuration: BSTConfig = null;
    private static _cli: boolean = false;

    public static async initializeCLI(createSource?: boolean): Promise<void> {
        createSource = typeof createSource === "undefined" ? true : createSource;
        Global.initialize(true);
        await Global.loadConfig(createSource);
    }

    public static async loadConfig(createSource?: boolean): Promise<void> {
        createSource = typeof createSource === "undefined" ? true : createSource;
        const config = await BSTConfig.load(createSource);
        Global._configuration = config;
    }

    public static cli(): boolean {
        return Global._cli;
    }

    public static config(): BSTConfig {
        return Global._configuration;
    }

    public static running(): BSTProcess {
        return BSTProcess.running();
    }

    public static initialize(cli?: boolean): void {
        if (cli !== undefined && cli !== null) {
            Global._cli = cli;
        }
        LoggingHelper.initialize(cli);
    }

    public static version(): string {
       return BSTConfig.getBstVersion();
    }

    public static messages(): any {
        return Global._configuration.getMessages();
     }
}

export enum NetworkErrorType {
    CONNECTION_REFUSED,
    OTHER,
    TIME_OUT
}