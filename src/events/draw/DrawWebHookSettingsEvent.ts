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

import AmqpEvent from "../../core/amqp/AmqpEvent";
import {QUEUES} from "../../globals";

class DrawWebHookSettingsEvent extends AmqpEvent {
    public static readonly type: string = "draw-web-hook-settings-event";
    public webhook: number;
    public message?: number;

    constructor(webhook: number, message?: number) {
        super(DrawWebHookSettingsEvent.type, {
            queue: QUEUES.WEB_HOOK_SETTINGS_SHOW_QUEUE,
        });
        this.webhook = webhook;
        this.message = message;
    }

    public serialize(): DrawWebHookSettingsEvent.Serialized {
        return {
            ...super.serialize(),
            webhook: this.webhook,
            message: this.message,
        };
    }
}

namespace DrawWebHookSettingsEvent {
    export interface Serialized extends AmqpEvent.Serialized {
        webhook: number;
        message?: number;
    }
}

export default DrawWebHookSettingsEvent;
