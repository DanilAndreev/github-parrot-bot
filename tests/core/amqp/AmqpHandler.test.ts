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

import AmqpHandler from "../../../src/core/amqp/AmqpHandler";
import * as Amqp from "amqplib";
import AMQPAck from "../../../src/core/errors/AMQPAck";
import AMQPNack from "../../../src/core/errors/AMQPNack";

@AmqpHandler.Handler("test-queue", 10)
class TestAmqpHandler extends AmqpHandler {
    public callback: Function;

    constructor(callback: Function) {
        super();
        this.callback = callback;
    }

    public async handle(): Promise<void> {
        return this.callback();
    }
}

describe("core->amqp->AmqpHandler", () => {
    const message: Amqp.Message = {
        content: Buffer.from(JSON.stringify({message: "Test message"})),
        fields: {} as Amqp.MessageFields,
        properties: {} as Amqp.MessageProperties,
    };

    let channel: Amqp.Channel;

    beforeAll(() => {
        jest.clearAllMocks();
    });

    beforeEach(() => {
        channel = ({
            ack: jest.fn(),
            nack: jest.fn(),
        } as unknown) as Amqp.Channel;
    });

    test("Regular execution.", async () => {
        const callback = jest.fn();
        const handler = new TestAmqpHandler(callback);
        await expect(handler.execute(message, channel)).resolves.not.toThrowError();
        expect(callback).toBeCalledTimes(1);
        expect(channel.ack).toBeCalled();
        expect(channel.nack).not.toBeCalled();
    });

    test("Acking with AMQPAck handler exception.", async () => {
        const callback = jest.fn(() => {
            throw new AMQPAck("Test ack.");
        });
        const handler = new TestAmqpHandler(callback);
        await expect(handler.execute(message, channel)).resolves.not.toThrowError();
        expect(channel.ack).toBeCalled();
        expect(channel.nack).not.toBeCalled();
    });

    test("Nacking with AMQPNack handler exception.", async () => {
        const callback = jest.fn(() => {
            throw new AMQPNack("Test nack.");
        });
        const handler = new TestAmqpHandler(callback);
        await expect(handler.execute(message, channel)).resolves.not.toThrowError();
        expect(channel.nack).toBeCalled();
        expect(channel.ack).not.toBeCalled();
    });

    test("Nacking with false(boolean!) handler return value.", async () => {
        const callback = jest.fn(() => {
            return false;
        });
        const handler = new TestAmqpHandler(callback);
        await expect(handler.execute(message, channel)).resolves.not.toThrowError();
        expect(channel.nack).toBeCalled();
        expect(channel.ack).not.toBeCalled();
    });

    test("Acking with true(boolean!) handler return value.", async () => {
        const callback = jest.fn(() => {
            return true;
        });
        const handler = new TestAmqpHandler(callback);
        await expect(handler.execute(message, channel)).resolves.not.toThrowError();
        expect(channel.ack).toBeCalled();
        expect(channel.nack).not.toBeCalled();
    });
});

describe("core->amqp->AmqpHandler | Metadata", () => {
    test("Class has metadata.", () => {
        expect(Reflect.getMetadata("amqp-handler", TestAmqpHandler)).toBe(true);
        expect(Reflect.getMetadata("amqp-handler-queue", TestAmqpHandler)).toEqual("test-queue");
        expect(Reflect.getMetadata("amqp-handler-prefetch", TestAmqpHandler)).toBe(10);
    });

    test("Class instance has metadata.", () => {
        const handler = new TestAmqpHandler(jest.fn());
        expect(Reflect.getMetadata("amqp-handler", handler)).toBe(true);
        expect(Reflect.getMetadata("amqp-handler-queue", handler)).toEqual("test-queue");
        expect(Reflect.getMetadata("amqp-handler-prefetch", handler)).toBe(10);
    });
});
