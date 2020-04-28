/// <reference types="monaco-editor" />
import * as React from 'react';
import { InfoRecord, LeanJsOpts, Message } from '@bryangingechen/lean-client-js-browser';
import { createPortal, findDOMNode, render } from 'react-dom';
import * as ReactPopper from 'react-popper';
import { server } from './langservice';

/** This is everything that lean needs to know to figure out which event handler to fire in the VM. */
interface eventHandlerId {
    route: number[],
    handler: number,
}

interface element {
    tag: "div" | "span" | "hr" | "button", // ... etc
    children: html[],
    attributes: { [k: string]: any },
    events: {
        "onClick"?: eventHandlerId
        "onMouseEnter"?: eventHandlerId
        "onMouseLeave"?: eventHandlerId
    }
    tooltip?: html
}
type component = html[]

type html =
    | component
    | string
    | element
    | null

export type widget = {
    file_name: string,
    line: number,
    column: number,
    html: html[] | null
}

function Html(props: widget) {
    let { html, ...rest } = props;
    return html.map(w => {
        if (typeof w === "string") { return w; }
        if (w instanceof Array) { return Html({ html: w, ...rest }); }
        let { tag, attributes, events, children, tooltip } = w;
        if (tag === "hr") { return <hr />; }
        attributes = attributes || {};
        events = events || {};
        let new_attrs: any = {};
        for (let k of Object.getOwnPropertyNames(attributes)) {
            new_attrs[k] = attributes[k];

        }
        for (let k of Object.getOwnPropertyNames(events)) {
            if (["onClick", "onMouseEnter", "onMouseLeave"].includes(k)) {
                new_attrs[k] = (e) => post({
                        command: "widget_event",
                        kind: k,
                        handler: events[k].handler,
                        route: events[k].route,
                        args: {}, // [todo]
                        file_name: props.file_name,
                        line: props.line,
                        column: props.column
                    });
            } else {
                console.error(`unrecognised event kind ${k}`);
            }
        }
        if (tooltip) {
            return <Popper popperContent={Html({html:[tooltip], ...rest})} refEltTag={tag} refEltAttrs={new_attrs} key={new_attrs.key}>{Html({html:children, ...rest})}</Popper>
        } else {
            return React.createElement(tag, new_attrs, Html({ html: children, ...rest }));
        }
    });
}

const Popper = (props) => {
    const { children, popperContent, refEltTag, refEltAttrs } = props;
    const [referenceElement, setReferenceElement] = React.useState(null);
    const [popperElement, setPopperElement] = React.useState(null);
    const [arrowElement, setArrowElement] = React.useState(null);
    const { styles, attributes } = ReactPopper.usePopper(referenceElement, popperElement, {
        modifiers: [{ name: 'arrow', options: { element: arrowElement } }],
    });
    const refElt = React.createElement(refEltTag, {ref : setReferenceElement, ...refEltAttrs}, children);
    return (
        <>
            {refElt}
            <div ref={setPopperElement} style={styles.popper} {...attributes.popper}>
                {popperContent}
                <div ref={setArrowElement} style={styles.arrow} />
            </div>
        </>
    );
}

export function Widget(props: { widget?: widget }) : JSX.Element {
    let { widget, ...rest } = props;
    if (!widget) { return; }
    return <div id="widget">
        <h1>Widget</h1>
        <div className="widget-container">{Html(widget)}</div>;
    </div>
}

function post(command) {
    return server.send(command);
}