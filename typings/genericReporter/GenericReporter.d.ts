/**
 * Generic type definitions for a generic reporter implementations.
 */

declare interface ConfigOptions {
    version: string;
    name: string;
    uiTestContainerId: string;
    hidePassedTests: boolean;
}

declare interface TimeKeeper {
    startTime: number;
    endTime: number;
    totTime: number;
}

declare interface QueueManagerStats {
    totDescribes: number;
    totExcDescribes: number;
    totIts: number;
    totExcIts: number;
    totFailedIts: number;
    timeKeeper: TimeKeeper;
    totFiltered?: number;
}

declare interface INote {
    it: IIt;
    apiName: string;
    expectedValue: any;
    matcherValue: any;
    result: boolean;
    exception?: Error;
}

declare interface Reason {
    reason: string;
    stackTrace: string[];
}


// /* Describes an It object */
declare interface IIt {
    parent: IDescribe;
    id: string;
    label: string;
    excluded: boolean;
    expectations: INote[];
    passed: boolean;
    reasons: Reason[];
    callStack: string[];
}

/* Describes a Describe object */
declare interface IDescribe {
    id: string;
    label: string;
    excluded: boolean;
    parent: IDescribe;
    passed: boolean;
}

/* Describes the interface that every Reporter must implement */
declare interface Reporter {
    reportBegin: (configOptions: ConfigOptions) => void;
    reportSummary: (queueManagerStats: QueueManagerStats) => void;
    reportSpec: (it: IIt) => void;
    reportEnd: (summaryInfo: QueueManagerStats) => void;
}

/* Describe Reporter's constructor */
declare function HtmlReporter(): Reporter;
