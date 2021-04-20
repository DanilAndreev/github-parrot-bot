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
    protected callbackQueryHandlers: Set<CallbackQueryDispatcher.CallbackQueryHandlerMeta>;

    constructor() {
        super()
        const callbackQueryHandlers = SystemConfig.getConfig<Config>().bot.callbackQueryHandlers;
        if (callbackQueryHandlers) {
            this.callbackQueryHandlers = callbackQueryHandlers.reduce(CallbackQueryDispatcher.handlersReducer, new Set());
        }
    }

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

    protected async handleCallbackQuery(query: CallbackQuery): Promise<void> {
        if (!query.data)
            throw new AMQPAck("Incorrect query callback data. Got falsy value.");

        const requestPattern = query.data.split(".");

        const promises: Promise<void>[] = [];
        for (const handler of this.callbackQueryHandlers) {
            const params: JSONObject | null = CallbackQueryDispatcher.comparePatterns(handler.pattern, requestPattern);
            if (params) {
                type Executor = () => Promise<void>;
                const executor: Executor = async () => await handler.callback(query, params);
                promises.push(executor());
            }
        }
        await Promise.all(promises);
    }

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
    export interface CallbackQueryHandlerOptions {
        exact?: boolean;
    }

    export interface CallbackQueryHandlerMeta {
        callback: (query: CallbackQuery, params: JSONObject) => void | Promise<void>;
        options: CallbackQueryHandlerOptions;
        pattern: string[];
    }

    export function CallbackQueryHandler(pattern: string | string[], options?: CallbackQueryHandlerOptions) {
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
