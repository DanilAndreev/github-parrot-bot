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

import AmqpEvent from "../../../src/core/amqp/AmqpEvent";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const AmqpDispatcherMock = require("../../../src/core/amqp/AmqpDispatcher");

jest.mock("../../../src/core/amqp/AmqpDispatcher");

class TestAmqpEvent extends AmqpEvent {
    public constructor(options?: AmqpEvent.Options) {
        super("test-event", options);
    }

    public serialize(): AmqpEvent.Serialized {
        return {
            ...super.serialize(),
            foo: 1,
            bar: "bar",
        };

    }
}

describe("core->amqp->AmqpEvent", () => {
    beforeEach(() => {
        AmqpDispatcherMock.default.clearQueues();
    });

    test("Correctness of setters and getters", () => {
        const event: TestAmqpEvent = new TestAmqpEvent({queue: "test-queue", expiration: 100});
        expect(event.getExpiration()).toEqual(100);
        expect(() => event.setExpiration(20)).not.toThrowError();
        expect(event.getExpiration()).toEqual(20);
        expect(() => event.makeIndefinite()).not.toThrowError();
        expect(event.getExpiration()).toBeUndefined();
        expect(() => event.serialize()).not.toThrowError();
        expect(event.serialize()).toEqual({
            type: "test-event",
            foo: 1,
            bar: "bar"
        });
    });

    test("Correctly enqueues.", async () => {
        const event = new TestAmqpEvent({queue: "test-queue"});
        await expect(event.enqueue()).resolves.not.toThrowError();
        expect(AmqpDispatcherMock.queues["test-queue"]).toBeTruthy();
        const message = AmqpDispatcherMock.queues["test-queue"][0];
        expect(message).toBeTruthy();
        expect(message.data).toEqual({
            type: "test-event",
            foo: 1,
            bar: "bar"
        });
    });

    test("Correctly enqueues with expiration.", async () => {
        const event = new TestAmqpEvent({queue: "test-queue", expiration: 100});
        await expect(event.enqueue()).resolves.not.toThrowError();
        expect(AmqpDispatcherMock.queues["test-queue"]).toBeTruthy();
        const message = AmqpDispatcherMock.queues["test-queue"][0];
        expect(message).toBeTruthy();
        expect(message.options.expiration).toEqual(100);
    });

    test("Error when amqp queue not specified.", async () => {
        const event = new TestAmqpEvent();
        await expect(event.enqueue()).rejects.toThrowError(ReferenceError);
    });
});
