import {LoggingHelper} from "./logging-helper";
import {BSTConfig} from "../client/bst-config";
import {BSTProcess} from "../client/bst-config";

export class Global {
    public static MessageDelimiter = "4772616365";
    public static MessageIDLength = 13;
    public static KeepAliveMessage = "KEEPALIVE";
    public static BespokeServerHost = "proxy.bespoken.tools";
    public static SpokesPipeDomain = "bespoken.link";
    public static SpokesDashboardHost = "apps.bespoken.io/dashboard";

    private static _configuration: BSTConfig = null;
    private static _cli: boolean = false;

    public static async initializeCLI(createConfigFileIfNeeded?: boolean): Promise<void> {
        createConfigFileIfNeeded = createConfigFileIfNeeded || true;
        Global.initialize(true);
        await Global.loadConfig(createConfigFileIfNeeded);
    }

    public static async loadConfig(createConfigFileIfNeeded?: boolean): Promise<void> {
        createConfigFileIfNeeded = createConfigFileIfNeeded || true;
        const config = await BSTConfig.load(createConfigFileIfNeeded);
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
}

export enum NetworkErrorType {
    CONNECTION_REFUSED,
    OTHER,
    TIME_OUT
}