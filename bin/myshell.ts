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

program
    .version("0.1.0")
    .option("-m, --matchers [pathToMatchers]", "Path to matchers")
    .option("-p, --preamble [pathToReporter]", "Path to preamble")
    .option("-s, --specs [pathToSpecs]", "Path to specs")
    .parse(process.argv);

console.log("Preamble-Ts running with");
if (program.matchers) console.log(`  - matchers: ${program.matchers}`);
if (program.preamble) console.log(`  - preamble: ${program.preamble}`);
if (program.specs) console.log(`  - specs: ${program.specs}`);

let matchers = require(program.matchers);
console.log("Node - pGlobal.preamble", pGlobal.preamble);

// TODO(js): should implement IReporter
class NodeReporter {
    constructor() { }
    reportBegin() { }
    reportSummary() { }
    reportSpec() { }
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
