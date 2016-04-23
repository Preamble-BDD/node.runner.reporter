#!/usr/bin/env node

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

interface Global extends NodeJS.Global {
    preamble: {
        reporters: any[]
    };
}

let pGlobal: Global = <Global>global;

/**
 * MyCommand
 * Extends ICommand with additional properties
 */

interface MyCommand extends commander.ICommand {
    matchers: string;
    preamble: string;
    specs: string;
}

/**
 * Module dependencies.
 */

let program: MyCommand = require("commander");
let chalk = require("chalk");
let passed = chalk.bold.green;
let failed = chalk.bold.red;

program
    .version("0.1.0")
    .option("-m, --matchers [pathToMatchers]", "Path to matchers")
    .option("-p, --preamble [pathToReporter]", "Path to preamble")
    .option("-s, --specs [pathToSpecs]", "Path to specs")
    .option("-n, --name [name]", "Name of specs [Suite]", "Suite")
    .parse(process.argv);

console.log("Preamble-TS-Node running with:");
if (program.matchers) console.log(`  - matchers: ${program.matchers}`);
if (program.preamble) console.log(`  - preamble: ${program.preamble}`);
if (program.specs) console.log(`  - specs: ${program.specs}`);
if (program.name) console.log(`  - name: ${program.name}`);

let matchers = require(program.matchers);
// console.log("Node - pGlobal.preamble", pGlobal.preamble);

let pluralize = (word: string, count: number): string =>
    (count > 1 || !count) && word + "s" || word;

let failedSpecs: IIt[] = [];

// TODO(js): should implement IReporter
class NodeReporter implements Reporter {
    confOpts: ConfigOptions;
    constructor() { }
    reportBegin(confOpts: ConfigOptions) {
        console.log();
        this.confOpts = confOpts;
        process.stdout.write("Running ");
    }
    reportSummary(summaryInfo: QueueManagerStats) { }
    reportSpec(it: IIt) {
        process.stdout.write(it.passed ? passed("*") : failed("x"));
        if (!it.passed) {
            failedSpecs.push(it);
        }
    }
    reportEnd(summaryInfo: QueueManagerStats) {
        let duration = `${parseInt((summaryInfo.timeKeeper.totTime / 1000).toString())}.${summaryInfo.timeKeeper.totTime % 1000}`;
        let op = `${program.name || this.confOpts.name}: ${summaryInfo.totIts} ${pluralize("spec", summaryInfo.totIts)}, ${summaryInfo.totFailedIts} ${pluralize("failure", summaryInfo.totFailedIts)}, ${summaryInfo.totExcIts} exluded\tcompleted in ${duration}s`;
        console.log();
        if (summaryInfo.totFailedIts) {
            console.log(failed(op));
        } else {
            console.log(passed(op));
        }
        // console.log(`%s: %s %s, %s %s, %s %s`, program.name || this.confOpts.name, summaryInfo.totIts, pluralize("spec", summaryInfo.totIts), summaryInfo.totFailedIts, pluralize("failure", summaryInfo.totFailedIts), summaryInfo.totExcIts, "excluded");
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
    }
}

let reporters = [];
reporters.push(new NodeReporter());
if (!pGlobal.hasOwnProperty("preamble")) {
    pGlobal.preamble = { reporters: reporters };
} else {
    pGlobal.preamble.reporters = reporters;
}

// run preamble
let preamble = require(program.preamble);

// load specs
require(program.specs);
