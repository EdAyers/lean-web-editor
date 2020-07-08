import { InfoServer } from './info_server';
import { Location, PinnedLocation, Config } from './extension';
import { Message, Server, Event } from 'lean-client-js-core';

export class SimpleInfoServer implements InfoServer {
    constructor(readonly lean: Server) {
        this.lean.allMessages.on(msgs => this.AllMessagesEvent.fire(msgs.msgs));
    }
    currentAllMessages: Message[] = [];
    clearHighlight(): void {
        throw new Error('Method not implemented.');
    }
    highlightPosition(loc: Location): void {
        throw new Error('Method not implemented.');
    }
    copyToComment(text: string): void {
        throw new Error('Method not implemented.');
    }
    reveal(loc: Location): void {
        throw new Error('Method not implemented.');
    }
    edit(loc: Location, text: string): void {
        throw new Error('Method not implemented.');
    }
    copyText(text: string): void {
        throw new Error('Method not implemented.');
    }
    syncPin(pins: PinnedLocation[]): void {
        throw new Error('Method not implemented.');
    }
    SyncPinEvent: Event<{ pins: PinnedLocation[]}> = new Event();
    PauseEvent: Event<unknown> = new Event();
    ContinueEvent: Event<unknown> = new Event();
    ToggleUpdatingEvent: Event<unknown> = new Event();
    CopyToCommentEvent: Event<unknown> = new Event();
    TogglePinEvent: Event<unknown> = new Event();
    ServerRestartEvent: Event<unknown> = new Event();
    ToggleAllMessagesEvent: Event<unknown> = new Event();
    AllMessagesEvent: Event<Message[]> = new Event();
    dispose() {}
}