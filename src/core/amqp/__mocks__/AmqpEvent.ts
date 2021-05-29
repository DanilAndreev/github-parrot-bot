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

import type AmqpEvent from "../AmqpEvent";

//TODO: use jest.createMockFromModule;

interface Queues {
    [queueName: string]: { data: any, options: AmqpEvent.Options };
}

export const queues: Queues = {};

export function clearQueues(): void {
    for (const key in queues) {
        delete queues[key];
    }
}

export function clearQueue(key: string): void {
    delete queues[key];
}

class AmqpEventMock {
    public static readonly type: string = "untyped-event";
    protected type: string;
    protected expiration: number | undefined;
    protected queue?: string;

    protected constructor(type?: string, options?: AmqpEvent.Options) {
        this.type = type || "untyped-event-mock";
        this.expiration = options?.expiration;
        this.queue = options?.queue;
    }

    public async enqueue(queue?: string): Promise<AmqpEventMock> {
        const targetQueue: string | undefined = this.queue || queue;
        if (!targetQueue) throw new ReferenceError(`You must specify queue name for enqueuing.`);
        queues[targetQueue] = {
            data: this.serialize(),
            options: {expiration: this.expiration},
        };
        return this;
    }

    public setExpiration(expiration: number): AmqpEventMock {
        this.expiration = expiration;
        return this;
    }

    public makeIndefinite(): AmqpEventMock {
        this.expiration = undefined;
        return this;
    }

    public getExpiration(): number | undefined {
        return this.expiration;
    }

    protected getType(): string {
        return this.type;
    }

    public serialize(): AmqpEvent.Serialized {
        return {
            type: this.type,
        };
    }
}

export default AmqpEventMock;
