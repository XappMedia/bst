import * as fs from "fs";
import { TestParser } from "skill-testing-ml";

export class InitUtil {
    private isMultilocale: boolean;

    constructor(
        public type: string,
        public platform: string,
        public locales: string,
        public projectName: string,
        public virtualDeviceToken?: string
        ) {
        this.isMultilocale = locales.split(",").length > 1;
    }

    public async createFiles(): Promise<void> {
        // utterances will change on unit test for google,
        // if plaform both was selected, utterances will have google's form
        const finalPlatform = ["both", "google"].indexOf(this.platform) > -1 ? "google" : this.platform;
        if (this.type === "both") {
            await this.createTestFilesForType("unit", finalPlatform);
            await this.createTestFilesForType("e2e", finalPlatform);
        } else {
            await this.createTestFilesForType(this.type, finalPlatform);
        }
    }

    private async createTestFilesForType(type: string, platform: string): Promise<void> {
        const currentFolder = process.cwd();
        if (!fs.existsSync(`${currentFolder}/test`)) {
            fs.mkdirSync(`${currentFolder}/test`);
        }
        const testFolder = `${currentFolder}/test/${type}`;
        if (!fs.existsSync(testFolder)) {
            fs.mkdirSync(testFolder);
        }

        await this.createMultilocaleFiles(type);

        const ymlContent = this.getYmlContent(type, platform);
        const testingFileContent = this.getTestingJson(type);
        await this.writeFile(`${testFolder}/index.test.yml`, ymlContent);
        await this.writeFile(`${currentFolder}/test/${type}/testing.json`, JSON.stringify(testingFileContent, null, 4));
    }

    private getYmlContent(type: string, platform: string): string {
        const parser = new TestParser();

        const configuration = {
            description: this.getTestSuiteDescription(type),
        };
        const interactions = [this.getLaunchInteraction(type), this.getHelpInteraction(type, platform)];
        const yamlObject = {
            configuration,
            "tests": [
                {
                    interactions,
                    "name": this.getTestName(),
                },
            ],
        };


        parser.loadYamlObject(yamlObject);
        let contents = parser.contents;
        // hacky way, because yaml to object doesnt support comments
        if (type === "unit" && platform === "google") {
            contents = `${contents}`.replace("- HelpIntent :", "- HelpIntent : #replace with the intent for help");
        }
        const comment = this.getHeaderComment(type);
        return `${comment}${contents}`;
    }

    private getTestSuiteDescription(type: string): string {
        if (this.isMultilocale) {
            return "testSuiteDescription";
        }

        if (type === "unit") {
            return "My first unit test suite";
        } else if (type === "e2e") {
            return "My first e2e test suite";
        }
        return "";
    }

    private getTestName(): string {
        if (this.isMultilocale) {
            return "firstTestName";
        }
        return "Launch and ask for help";
    }

    private getLaunchInteraction(type: string): object {
        let expected = "";
        let input = "";
        if (this.isMultilocale) {
            input = "LaunchRequest";
            expected = "launchPrompt";
        } else {
            if (type === "unit") {
                input = "LaunchRequest";
                expected = `Welcome to ${this.projectName}`;
            } else if (type === "e2e") {
                input = `open ${this.projectName}`;
                expected = `Welcome to ${this.projectName}`;
            }
        }
        return {
            "expected": [
                {
                    "action": "prompt",
                    "operator": ":",
                    "value": expected,
                },
            ],
            input,
        };
    }

    private getHelpInteraction(type: string, platform: string): object {
        let expectedPrompt = "helpPrompt";
        let expectedCardContent = "helpPrompt";
        let expectedCardTitle = "cardTitle";
        let input = "";

        if (this.isMultilocale) {
            if (type === "unit") {
                input = platform === "alexa" ? "AMAZON.HelpIntent" : "HelpIntent";
            } else if (type === "e2e") {
                input = "helpUtterance";
            }
        } else {
            if (type === "unit") {
                input = platform === "alexa" ? "AMAZON.HelpIntent" : "HelpIntent";

            } else if (type === "e2e") {
                input = "help";
            }
            expectedPrompt = "What can I help you with?";
            expectedCardContent = "What can I help you with?";
            expectedCardTitle = this.projectName;
        }
        return {
            "expected": [
                {
                    "action": "prompt",
                    "operator": ":",
                    "value": expectedPrompt,
                },
                {
                    "action": "cardContent",
                    "operator": ":",
                    "value": expectedCardContent,
                },
                {
                    "action": "cardTitle",
                    "operator": ":",
                    "value": expectedCardTitle,
                },
            ],
            input,
        };
    }

    private getTestingJson(type: string): any {
        const testingJsonForUnit = {
            handler: "relative or absolute path to your voice app entry point",
            locales: this.locales,
        };
        const testingJsonForE2e = {
            virtualDeviceToken: this.virtualDeviceToken || "[your virtual device token goes here]",
            locales: this.locales,
            type: "e2e",
        };
        if (this.platform === "google") {
            testingJsonForUnit["platform"] = "google";
        }
        return type === "unit" ? testingJsonForUnit : testingJsonForE2e;
    }

    private getHeaderComment(type: string): string {
        let link = type === "e2e" ?
            "https://read.bespoken.io/end-to-end/getting-started/" :
            "https://read.bespoken.io/unit-testing/getting-started/";
        const multilocaleComment = `# This is the test file for your ${type} tests, feel free to copy and modify the template test
# for your voice app as many times as you want. On this same folder you'll also find a testing.json
# file, it contains global configurations for future test files you might create in the future.
# You'll also find a folder called locales, it contains the localization files for all your supported
# locales. Just put a value to each variable and they will be replaced here. Add, remove or modify
# as necessary.
#
# Find more info on ${link}
`;
        const singlelocaleComment = `# This is the test file for your ${type} tests, feel free to copy and modify the template test
# for your voice app as many times as you want. On this same folder you'll also find a testing.json
# file, it contains global configurations for future test files you might create in the future.
#
# Find more info on ${link}
`;
        return this.isMultilocale ? multilocaleComment : singlelocaleComment;
    }

    private async createMultilocaleFiles(type: string): Promise<void> {
        if (!this.isMultilocale) {
            return;
        }
        const currentFolder = process.cwd();

        if (!fs.existsSync(`${currentFolder}/test/${type}/locales`)) {
            fs.mkdirSync(`${currentFolder}/test/${type}/locales`);
        }

        const localizedValues = {
            testSuiteDescription: "My first unit test suite",
            firstTestName: "Launch and ask for help",
            launchPrompt: `Welcome to ${this.projectName}`,
            helpPrompt: "What can I help you with?",
            helpCardContent: "What can I help you with?",
            helpCardTitle: this.projectName,
        };
        await Promise.all(this.locales.split(",").filter((x) => x).map((locale) => {
            locale = locale.trim();
            const enOnlyComment = locale === "en-US" ? " for en-US" : "";
            const comment = `# This is the localization file${enOnlyComment}. Please, modify the values so that they align
# with your voice app responses for this locale

`;
            let localizedFileContent = "";
            if (locale === "en-US") {
                localizedFileContent = Object.keys(localizedValues)
                    .map((key) => `${key}: ${localizedValues[key]}`)
                    .join("\n");
            } else {
                localizedFileContent = Object.keys(localizedValues)
                    .map((key) => `${key}:`)
                    .join("\n");
            }
            localizedFileContent = `${comment}${localizedFileContent}`;
            return this.writeFile(`${currentFolder}/test/${type}/locales/${locale}.yml`,
                localizedFileContent);
        }));
    }

    private async writeFile(path: string, toWrite: any): Promise<void> {
        return new Promise((resolve, reject) => {
            fs.writeFile(path, toWrite, (err) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve();
            });
        });
     }
}