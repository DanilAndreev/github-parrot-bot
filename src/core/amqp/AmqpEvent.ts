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

import JSONObject from "../../interfaces/JSONObject";
import AmqpDispatcher from "./AmqpDispatcher";

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
    protected expiration: number | undefined;
    /**
     * queue - default AMQP queue name for event enqueuing.
     */
    protected queue?: string;

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
    }

    public async enqueue(queue?: string): Promise<AmqpEvent> {
        const targetQueue: string | undefined = this.queue || queue;
        if (!targetQueue) throw new ReferenceError(`You must specify queue name for enqueuing.`);
        await AmqpDispatcher.getCurrent().sendToQueue(targetQueue, this.serialize(), {expiration: this.expiration});
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
            type: this.type,
        };
    }
}

namespace AmqpEvent {
    export interface Options {
        expiration?: number;
        queue?: string;
    }

    export interface Serialized extends JSONObject {
        type: string;
    }
}

export default AmqpEvent;
