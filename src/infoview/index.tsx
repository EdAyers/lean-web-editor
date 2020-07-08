import * as React from 'react';
import { InfoView as Inner } from './main';
import { SimpleInfoServer } from './simple_info_server';
import { server as lean } from '../langservice';
import { cursorTo } from 'readline';
import { defaultConfig, Location, Config } from './extension';

const server = new SimpleInfoServer(lean);

interface InfoViewProps {
    file: string;
    cursor?: {line: number, column: number};
    config?: Config
}

export function InfoView(props : InfoViewProps) {
    const config = props.config || defaultConfig;
    const loc : Location = props.cursor ? {file_name: props.file, column: props.cursor.column, line: props.cursor.line} : null;
    return <Inner server={server} loc={loc} config={config}/>;
}

