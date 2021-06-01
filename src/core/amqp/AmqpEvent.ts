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

import JSONObject from "../interfaces/JSONObject";
import * as Amqp from "amqplib";
import {Logger} from "../logger/Logger";

/**
 * AmqpEvent - base class for AMQP events.
 * @class
 * @author Danil Andreev
 */
abstract class AmqpEvent {
    /**
     * type - event type.
     */
    public static readonly type: string = "untyped-event";
    /**
     * type - event type. Needed for event identification.
     */
    protected type: string;
    /**
     * expiration - event expiration time.
     */
    protected expiration?: number;
    /**
     * queue - default AMQP queue name for event enqueuing.
     */
    protected queue?: string;

    protected connection?: Amqp.Connection;

    protected static connection?: Amqp.Connection | Function;

    /**
     * Creates an instance of AmqpEvent.
     * @constructor
     * @param type - event type.
     * @param options - event AMQP options.
     * @author Danil Andreev
     */
    protected constructor(type?: string, options?: AmqpEvent.Options) {
        this.type = type || AmqpEvent.type;
        this.expiration = options?.expiration;
        this.queue = options?.queue;
        this.connection = options?.connection || this.getDefaultConnection();
    }

    private getDefaultConnection(): Amqp.Connection | undefined {
        const thisStatic: typeof AmqpEvent = this.constructor as typeof AmqpEvent;
        switch (typeof thisStatic.connection) {
            case "function":
                return thisStatic.connection();
            case "object":
                return thisStatic.connection;
            default:
                return;
        }
    }

    public async enqueue(): Promise<AmqpEvent> {
        if (!this.connection) throw new ReferenceError(`You must specify AMQP connection before enqueuing.`);
        if (!this.queue) throw new ReferenceError(`You must specify queue name for enqueuing.`);
        Logger.debug(`Sent message to AMQP queue: "${this.queue}".`);
        const channel: Amqp.Channel = await this.connection.createChannel();
        await channel.assertQueue(this.queue);
        channel.sendToQueue(this.queue, Buffer.from(JSON.stringify(this.serialize())), {expiration: this.expiration});
        await channel.close();
        return this;
    }

    public setConnection(connection: Amqp.Connection): AmqpEvent {
        this.connection = connection;
        return this;
    }

    public setQueue(queue: string): AmqpEvent {
        this.queue = queue;
        return this;
    }

    /**
     * setExpiration - sets event expiration.
     * @method
     * @param expiration - expiration time in milliseconds.
     * @author Danil Andreev
     */
    public setExpiration(expiration: number): AmqpEvent {
        this.expiration = expiration;
        return this;
    }

    /**
     * makeIndefinite - set expiration time to indefinite.
     * @method
     * @author Danil Andreev
     */
    public makeIndefinite(): AmqpEvent {
        this.expiration = undefined;
        return this;
    }

    /**
     * getExpiration - getter for event expiration time.
     * @method
     * @author Danil Andreev
     */
    public getExpiration(): number | undefined {
        return this.expiration;
    }

    /**
     * getType - getter for event type.
     * @method
     * @author Danil Andreev
     */
    protected getType(): string {
        return this.type;
    }

    /**
     * serialize - serializes event for web exchange.
     * @method
     * @author Danil Andreev
     */
    public serialize(): AmqpEvent.Serialized {
        return {
            type: this.getType(),
        };
    }
}

namespace AmqpEvent {
    export interface Options {
        connection?: Amqp.Connection;
        expiration?: number;
        queue?: string;
    }

    export interface Serialized extends JSONObject {
        type: string;
    }
}

export default AmqpEvent;
