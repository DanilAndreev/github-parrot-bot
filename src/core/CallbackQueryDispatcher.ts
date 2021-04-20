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

import SystemConfig from "./SystemConfig";
import Config from "../interfaces/Config";
import JSONObject from "../interfaces/JSONObject";
import Constructable from "../interfaces/Constructable";
import {CallbackQuery} from "node-telegram-bot-api";
import AMQPAck from "../errors/AMQPAck";
import AmqpHandler from "./AmqpHandler";

class CallbackQueryDispatcher extends AmqpHandler {
    /**
     * callbackQueryHandlers - registered handlers.
     */
    protected callbackQueryHandlers: Set<CallbackQueryDispatcher.CallbackQueryHandlerMeta>;

    /**
     * Creates an instance of CallbackQueryDispatcher
     * @constructor
     * @author Danil Andreev
     */
    constructor() {
        super()
        const callbackQueryHandlers = SystemConfig.getConfig<Config>().bot.callbackQueryHandlers;
        if (callbackQueryHandlers) {
            this.callbackQueryHandlers = callbackQueryHandlers.reduce(CallbackQueryDispatcher.handlersReducer, new Set());
        }
    }

    /**
     * handlersReducer - reducer for getting all handlers from all classes containers.
     * @method
     * @param accumulator
     * @param current
     * @author Danil Andreev
     */
    protected static handlersReducer(
        accumulator: Set<CallbackQueryDispatcher.CallbackQueryHandlerMeta>,
        current: Constructable
    ): Set<CallbackQueryDispatcher.CallbackQueryHandlerMeta> {
        const methods: Set<CallbackQueryDispatcher.CallbackQueryHandlerMeta> = Reflect
            .getMetadata("callback-query-handlers", current) || new Set();
        for (const method of methods)
            accumulator.add(method);
        return accumulator;
    }

    /**
     * handleCallbackQuery - handler for callback query. Decides which handlers to call using pattern in callback data.
     * @method
     * @param query - Input callback query object.
     * @throws AMQPAck
     * @throws AMQPNack
     * @author Danil Andreev
     */
    protected async handleCallbackQuery(query: CallbackQuery): Promise<void> {
        if (!query.data)
            throw new AMQPAck("Incorrect query callback data. Got falsy value.");

        const requestPattern = query.data.split(".");

        const promises: Promise<void>[] = [];
        for (const handler of this.callbackQueryHandlers) {
            if (handler.options.exact && handler.pattern.length !== requestPattern.length)
                continue;
            const params: JSONObject | null = CallbackQueryDispatcher.comparePatterns(handler.pattern, requestPattern);
            if (params) {
                type Executor = () => Promise<void>;
                const executor: Executor = async () => await handler.callback(query, params);
                promises.push(executor());
            }
        }
        await Promise.all(promises);
    }

    /**
     * comparePatterns - compares request and handler patterns.
     * @method
     * @param handlerPattern - Handler pattern in format: "hello.:darkness.my.old.:friend".
     * @param requestPattern - Request data split by ".".
     * @author Danil Andreev
     */
    protected static comparePatterns(handlerPattern: string[], requestPattern: string[]): JSONObject | null {
        const variables: JSONObject = {};
        if (handlerPattern.length > requestPattern.length)
            return null;
        for (let i = 0; i < handlerPattern.length; i++) {
            if (handlerPattern[i].slice(0, 1) === ":") {
                variables[handlerPattern[i].slice(1)] = requestPattern[i]
                continue;
            }
            if (handlerPattern[i] !== requestPattern[i]) {
                return null;
            }
        }
        return variables;
    }
}

namespace CallbackQueryDispatcher {
    /**
     * CallbackQueryHandlerOptions - options for callback handler binding.
     * @interface
     * @author Danil Andreev
     */
    export interface CallbackQueryHandlerOptions {
        /**
         * exact - if true, handler will be called only if pattern exactly matches the request.
         */
        exact?: boolean;
    }

    /**
     * CallbackQueryHandlerMeta - object with handler metadata.
     * @interface
     * @author Danil Andreev
     */
    export interface CallbackQueryHandlerMeta {
        /**
         * callback - callback function for handling request.
         * @function
         * @param query - CallbackQuery object.
         * @param params - Request params got from request data using handler pattern.
         * @author Danil Andreev
         */
        callback: (query: CallbackQuery, params: JSONObject) => void | Promise<void>;
        /**
         * options - handler options.
         */
        options: CallbackQueryHandlerOptions;
        /**
         * pattern - handler pattern.
         */
        pattern: string[];
    }

    /**
     * CallbackQueryHandler - decorator for callback query handler functions.
     * @function
     * @param pattern - handler Handler pattern in format: "hello.:darkness.my.old.:friend".
     * @param options - handler binding options.
     * @author Danil Andreev
     * @example
     * import CallbackQueryDispatcher from "../../../core/CallbackQueryDispatcher";
     * import {CallbackQuery} from "node-telegram-bot-api";
     * import JSONObject from "../../../interfaces/JSONObject";

     * export default class QueryCallbacks {
     *     @CallbackQueryDispatcher.CallbackQueryHandler("pull_request.:id.maximize", {exact: true})
     *     public static async handle(query: CallbackQuery, params: JSONObject): Promise<void> {
     *         console.log("Hello from query callback handler.");
     *     }
     * }
     */
    export function CallbackQueryHandler(pattern: string | string[], options?: CallbackQueryHandlerOptions): Function {
        if (typeof pattern === "string")
            pattern = pattern.split(".");

        return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
            const metadata: Set<CallbackQueryHandlerMeta> = Reflect.getMetadata("callback-query-handlers", target) || new Set();
            metadata.add({
                callback: target[propertyKey],
                options: options || {},
                pattern: pattern as string[],
            });
            Reflect.defineMetadata("callback-query-handlers", metadata, target);
        };
    }
}

export default CallbackQueryDispatcher;
