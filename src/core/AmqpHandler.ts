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
import {Context} from "koa";


class AmqpHandler {
    protected handle(payload: any, ctx: Context): void | Promise<void> {
        throw new ReferenceError(`Abstract method call. Inherit this class and override this method.`);
    }

    public async execute(message: Amqp.Message, channel: Amqp.Channel) {
        try {
            const {payload, ctx} = JSON.parse(message.content.toString());
            await this.handle(payload, ctx);
            channel.ack(message);
        } catch (error) {
            channel.nack(message);
            console.error(error);
        }
    }
}

namespace AmqpHandler {
    /**
     * Handler - decorator for Amqp queue handler.
     * @param queue - Queue name.
     * @param prefetch - prefetch messages quantity.
     * @author Danil Andreev
     */
    export function Handler(queue: string, prefetch?: number) {
        return function AmqpHandlerWrapper<T extends new(...args: any[]) => {}>(objectConstructor: T): T {
            return class WrappedAmqpHandler extends objectConstructor {
                constructor(...args: any[]) {
                    super(...args);
                    Reflect.defineMetadata("amqp-handler", true, WrappedAmqpHandler);
                    Reflect.defineMetadata("amqp-handler-queue", queue, WrappedAmqpHandler);
                    Reflect.defineMetadata("amqp-handler", true, this);
                    Reflect.defineMetadata("amqp-handler-queue", queue, this);
                    prefetch && Reflect.defineMetadata("amqp-handler-prefetch", prefetch, this);
                }
            };
        };
    }
}

export default AmqpHandler;
