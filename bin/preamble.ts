#!/usr/bin/env node

// TODO(js): Change version command from "V" to "v"

/**
 * How I imagine this all working:
 *
 * argV contains the path to matchers, the path to (eventually) a suitable
 * command line reporter (or use the default command-line reporter) and the
 * path to user's script file(s).
 *
 * load the matchers file and add the matchers to global (preambleGlobal.matchers)
 *
 * load the reporter file and add the reporter to global (preambleGlobal.reporters)
 *
 * run core main.js, which will place its api on the global and wait for calls
 * into its api
 *
 * load user's script file(s), which will be processed by preamble core and
 * reported using the reporter from argV
 */
"use strict";

/**
 * define preamble global
 */

interface PreambleConfig {
    timeoutInterval: number;
    shortCircuit: boolean;
}

interface Global extends NodeJS.Global {
    preamble: {
        reporters: any[],
        preambleConfig: PreambleConfig
    };
}

/**
 * define MyCommand
 */

interface MyCommand extends commander.ICommand {
    specs: string;
    testName: string;
    timeoutInterval: number;
    shortCircuit: boolean;
    quietMode: boolean;
}

/**
 * Command Line
 */

let path = require("path");
let program: MyCommand = require("commander");
let chalk = require("chalk");
let passed = chalk.bold.green;
let failed = chalk.bold.red;
let processName = "Preamble-TS-Node";

program
    .version("0.1.0") // TODO(js): this should be pulled from package.json version field
    .option("-s, --specs [pathToSpecs]", "Path to specs")
    .option("-n, --testName [testName]", "Name for test [Suite]", "Suite")
    .option("-t, --timeoutInterval [timeoutInterval]", "Configuration timeoutInterval", 5000)
    .option("-q, --shortCircuit [shortCircuit]", "Configuration shortCircuit", false)
    .option("-Q, --quietMode", "Run in quiet mode")
    .parse(process.argv);

/**
 * Reporter
 */

let pluralize = (word: string, count: number): string =>
    (count > 1 || !count) && word + "s" || word;

let failedSpecs: IIt[] = [];

class NodeReporter implements Reporter {
    confOpts: ConfigOptions;
    constructor() { }
    reportBegin(confOpts: ConfigOptions) {
        console.log();
        this.confOpts = confOpts;
        process.stdout.write("Running ");
        if (!program.quietMode) {
            console.log(`${processName} v${confOpts.version} with:`);
            if (program.specs) console.log(`  - specs: ${program.specs}`);
            if (program.testName) console.log(`  - testName: ${program.testName}`);
            if (program.timeoutInterval) console.log(`  - timeoutInterval: ${program.timeoutInterval}`);
            if (program.hasOwnProperty("shortCircuit")) console.log(`  - shortCircuit: ${program.shortCircuit}`);
            if (program.hasOwnProperty("quietMode")) console.log(`  - quietMode: ${program.quietMode}`);
        } else {
            console.log(`${processName} v${confOpts.version}:`);
        }
    }
    reportSummary(summaryInfo: QueueManagerStats) { }
    reportSpec(it: IIt) {
        process.stdout.write(it.passed ? passed("*") : failed("x"));
        if (!it.passed) {
            failedSpecs.push(it);
        }
    }
    reportEnd(summaryInfo: QueueManagerStats) {
        let duration = `${parseInt((summaryInfo.timeKeeper.totTime / 1000)
            .toString())}.${summaryInfo.timeKeeper.totTime % 1000}`;
        let op = `${program.testName || this.confOpts.name}: ${summaryInfo.totIts} ${pluralize("spec", summaryInfo.totIts)}, ${summaryInfo.totFailedIts} ${pluralize("failure", summaryInfo.totFailedIts)}, ${summaryInfo.totExcIts} excluded\tcompleted in ${duration}s`;
        console.log();
        if (summaryInfo.totFailedIts) {
            console.log(failed(op));
        } else {
            console.log(passed(op));
        }
        if (failedSpecs.length) {
            failedSpecs.forEach((it) => {
                console.log();
                it.reasons.forEach((reason) => {
                    console.log(failed(reason.reason));
                    reason.stackTrace.forEach((stackTrace) => {
                        console.log("\t" + failed(stackTrace));
                    });
                });
            });
        }
        console.log();
        // set process exit code accordingly
        process.exit(summaryInfo.totFailedIts ? 1 : 0);
    }
}

/**
 * Configuration
 */

let pGlobal: Global = <Global>global;

let preambleConfig: PreambleConfig = {
    timeoutInterval: program.timeoutInterval,
    shortCircuit: program.shortCircuit
};

let reporters = [new NodeReporter()];

pGlobal.preamble = { reporters: reporters, preambleConfig: preambleConfig };

/**
 * Matchers
 */

let matchers = require("@preamble/preamble-ts-matchers");

/**
 * Run core
 */

let preamble = require("@preamble/preamble-ts-core");
preamble();

/**
 * Specs
 */

require(path.resolve(program.specs));
