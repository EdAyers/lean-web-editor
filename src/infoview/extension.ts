/* This file contains everything that is specific to the vscode extension
implementation of the infoview. So the idea is that lean-web-editor
shares the rest of this infoview directory with this project. */
import {Task} from 'lean-client-js-core';
export const trythis : any = undefined;

export interface Location {
    file_name: string;
    line: number;
    column: number;
}

export interface PinnedLocation extends Location {
    key: number;
}

export function locationEq(l1: Location, l2: Location): boolean {
    return l1.column === l2.column && l1.line === l2.line && l1.file_name === l2.file_name
}

export interface ServerStatus {
    stopped: boolean;
    isRunning: boolean;
    numberOfTasks: number;
    tasks: Task[];
}

export interface InfoViewTacticStateFilter {
    name?: string;
    regex: string;
    match: boolean;
    flags: string;
}

export interface Config {
    filterIndex: number;
    infoViewTacticStateFilters: InfoViewTacticStateFilter[];
    infoViewAllErrorsOnLine: boolean;
    infoViewAutoOpenShowGoal: boolean;
}
export const defaultConfig: Config = {
    filterIndex: -1,
    infoViewTacticStateFilters: [],
    infoViewAllErrorsOnLine: true,
    infoViewAutoOpenShowGoal: true,
}
