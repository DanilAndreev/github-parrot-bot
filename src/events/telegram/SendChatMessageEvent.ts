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
import {SendMessageOptions} from "node-telegram-bot-api";
import {QUEUES} from "../../globals";

class SendChatMessageEvent extends AmqpEvent {
    public static readonly type: string = "send-chat-message";
    public chatId: string | number;
    public text: string;
    public options?: SendMessageOptions;

    public constructor(chatId: string | number, text: string, options?: SendMessageOptions) {
        super(SendChatMessageEvent.type, {
            expiration: 1000 * 60 * 10,
            queue: QUEUES.DRAW_TELEGRAM_MESSAGE_QUEUE,
        });
        this.chatId = chatId;
        this.text = text;
        this.options = options;
    }

    public serialize(): SendChatMessageEvent.Serialized {
        return {
            ...super.serialize(),
            chatId: this.chatId,
            text: this.text,
            options: this.options,
        };
    }
}

namespace SendChatMessageEvent {
    export interface Serialized extends AmqpEvent.Serialized {
        chatId: string | number;
        text: string;
        options?: SendMessageOptions;
    }
}

export default SendChatMessageEvent;