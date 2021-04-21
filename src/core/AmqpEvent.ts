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

/**
 * AmqpEvent - abstract base class for AMQP events.
 * @class
 * @author Danil Andreev
 */
abstract class AmqpEvent {
    /**
     * type - event type. Needed for event identification.
     */
    public readonly type: string;

    /**
     * Creates an instance of AmqpEvent.
     * @constructor
     * @param type - event type.
     * @author Danil Andreev
     */
    protected constructor(type: string) {
        this.type = type;
    }

    /**
     * serialize - serializes event for web exchange.
     * @method
     * @author Danil Andreev
     */
    public serialize<T extends JSONObject>(): T {
        return {
            type: this.type,
        }
    }

    /**
     * Deserializes event from JSON.
     * @method
     * @param serialized - Serialized event object.
     * @author Danil Andreev
     */
    public static deserialize<T extends JSONObject = JSONObject>(serialized: T): AmqpEvent {
        throw new
    }
}

export default AmqpEvent;
