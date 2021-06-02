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

import type * as Amqp from "amqplib";
import JSONObject from "../../interfaces/JSONObject";

const AmqpDispatcher: any = jest.createMockFromModule("../AmqpDispatcher");

interface Queues {
    [queueName: string]: {data: any; options: Amqp.Options.Publish}[];
}

const queues: Queues = {};

async function sendToQueue<T extends JSONObject>(
    queueName: string,
    message: T,
    options: Amqp.Options.Publish = {}
): Promise<void> {
    if (!Array.isArray(queues[queueName])) queues[queueName] = [];
    queues[queueName].push({data: message, options});
}

function clearQueues() {
    for (const key in queues) {
        delete queues[key];
    }
}

AmqpDispatcher.default = {
    getCurrent: () => ({
        sendToQueue,
    }),
    init: jest.fn(),
    queues,
    clearQueues,
    determineHandlerIsRequired: jest.fn().mockReturnValue(true),
};
AmqpDispatcher.queues = queues;
module.exports = AmqpDispatcher;
