/*
 * Author: Danil Andreev | danssg08@gmail.com | https://github.com/DanilAndreev
 *
 * MIT License
 *
 * Copyright (c) 2021 Danil Andreev
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import {EventEmitter} from "events";
import type {Message} from "node-telegram-bot-api";

const botApiMock: any = jest.createMockFromModule("node-telegram-bot-api");

interface TextHandler {
    regexp: RegExp,
    callback: Function,
}

const eventsEmitter = new EventEmitter();
const textHandlers: TextHandler[] = [];

botApiMock.prototype.addListener = jest.fn().mockImplementation((event: string, callback: (...args) => void) => {
    eventsEmitter.addListener(event, callback);
});

botApiMock.prototype.onText = jest.fn().mockImplementation((regexp: RegExp, callback: Function) => {
    textHandlers.push({regexp, callback});
});

botApiMock.clearTextHandlers = jest.fn().mockImplementation(() => {
    textHandlers.slice(0, 0);
});

botApiMock.emitEvent = jest.fn().mockImplementation((event: string, data: any) => {
    eventsEmitter.emit(event, data);
});

function textHandler(message: Message) {
    if (!message.text) return;
    for (const handler of textHandlers) {
        if (handler.regexp.test(message.text)) {
            const match: RegExpExecArray | null = handler.regexp.exec(message.text);
            handler.callback(message, match);
        }
    }
}
eventsEmitter.addListener("text", textHandler);

botApiMock.clearListeners = jest.fn().mockImplementation(() => {
    eventsEmitter.removeAllListeners();
    eventsEmitter.addListener("text", textHandler);
});

botApiMock.eventsEmitter = eventsEmitter;

module.exports = botApiMock;
