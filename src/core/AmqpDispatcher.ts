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

import * as Amqp from "amqplib";
import {Connection} from "amqplib";
import config from "../config";
import AmqpHandler from "./AmqpHandler";


class AmqpDispatcher {
    protected static current: AmqpDispatcher;

    protected handlers: AmqpHandler[] = [];
    protected connection: Connection;

    constructor(connection: Connection) {
        this.connection = connection;

        this.handlers = config.amqp.handlers.map((HandlerClass: typeof AmqpHandler) => {
            return new HandlerClass()
        })

        for (const handler of this.handlers) {
            this.hook(handler).catch((error: Error) => {
                throw error
            });
        }
    }


    public async hook(handler: AmqpHandler) {
        const queueName = Reflect.getMetadata("amqp-handler-queue", handler);
        const prefetch = Reflect.getMetadata("amqp-handler-prefetch", handler);
        if (typeof queueName !== "string")
            throw new TypeError(`Invalid handler. You have to inherit your handler from AmqpHandler and decorate it with AmqpHandler.Handler decorator.`);
        const channel: Amqp.Channel = await this.connection.createChannel();
        await channel.assertQueue(queueName);
        await channel.prefetch(prefetch || 10);
        await channel.consume(queueName, (msg) => msg && handler.execute(msg, channel));
    }

    public static async init(): Promise<AmqpDispatcher> {
        const connection: Connection = await Amqp.connect(config.amqp.connect);
        AmqpDispatcher.current = new AmqpDispatcher(connection);

        return AmqpDispatcher.current;
    }

    public static getCurrent(): AmqpDispatcher {
        return this.current;
    }

    public getConnection(): Connection {
        return this.connection;
    }
}

export default AmqpDispatcher;
