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
import {Message} from "amqplib";
import AMQPAck from "../errors/AMQPAck";
import {Logger} from "./Logger";

class AmqpHandler {
    protected handle(content: any, message: Message): void | Promise<void | boolean> {
        throw new ReferenceError(`Abstract method call. Inherit this class and override this method.`);
    }

    public async execute(message: Amqp.Message, channel: Amqp.Channel) {
        try {
            Logger?.debug(`Got AMQP message. ${JSON.stringify({id: message.properties.messageId, queue: message.fields.routingKey})}`);
            const content: any = JSON.parse(message.content.toString());
            const result: boolean | void = await this.handle(content, message);
            if (result === false) {
                Logger?.debug(`Got AMQP message NACKed. Queue: ${message.fields.routingKey}. Reason: Handler returned false value.`);
                channel.nack(message);
            } else {
                Logger?.silly(`AMQP message ACKed. Queue: ${message.fields.routingKey}`);
                channel.ack(message);
            }
        } catch (error) {
            if (error instanceof AMQPAck) {
                Logger?.silly(`AMQP message ACKed. Queue: ${message.fields.routingKey}`);
                channel.ack(message);
            } else {
                Logger?.debug(`Got AMQP message NACKed. Queue: ${message.fields.routingKey}. Reason: ${error}`);
                channel.nack(message);
            }
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
        return function AmqpHandlerWrapper<T extends new (...args: any[]) => {}>(objectConstructor: T): T {
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
