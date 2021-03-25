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

import {Issues, PullRequest} from "github-webhook-event-types";
import {Context} from "koa";


/**
 * WebHookEvent - base class for WebHook event handlers.
 * @class
 * @abstract
 * @author Danil Andreev
 */
class WebHookEvent {
    /**
     * handle - event handler method.
     * @method
     * @abstract
     * @param event - Incoming event.
     */
    public handle(event: WebHookEvent.WebHookPayload<any>): void | Promise<void> {
        throw new ReferenceError(`Abstract method call. Inherit this class and override this method.`);
    }
}

namespace WebHookEvent {
    /**
     * Target - decorator for WebHook event.
     * @param event_name - Target event name.
     * @author Danil Andreev
     */
    export function Target(event_name: string) {
        return function BotCommandWrapper<T extends new(...args: any[]) => {}>(objectConstructor: T): T {
            return class WrappedWebHookEvent extends objectConstructor {
                constructor(...args: any[]) {
                    super(...args);
                    Reflect.defineMetadata("webhook-event", true, this);
                    Reflect.defineMetadata("webhook-event-target", event_name, this);
                }
            };
        };
    }

    /**
     * WebHookPayload - interface for web hook payload.
     * @interface
     * @author Danil Andreev
     */
    export interface WebHookPayload<T extends Issues | PullRequest> {
        /**
         * GitHub event payload.
         */
        payload: T;
        /**
         * Koa context.
         */
        ctx: Context;
    }
}

export default WebHookEvent;
