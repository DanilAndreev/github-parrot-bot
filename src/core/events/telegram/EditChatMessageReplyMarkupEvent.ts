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

import {EditMessageReplyMarkupOptions, InlineKeyboardMarkup} from "node-telegram-bot-api";
import AmqpEvent from "../../amqp/AmqpEvent";
import {QUEUES} from "../../../Globals";

class EditChatMessageReplyMarkupEvent extends AmqpEvent {
    public static readonly type: string = "edit-chat-message-reply-markup";
    public replyMarkup: InlineKeyboardMarkup;
    public options?: EditMessageReplyMarkupOptions;

    constructor(replyMarkup: InlineKeyboardMarkup, options?: EditMessageReplyMarkupOptions) {
        super(EditChatMessageReplyMarkupEvent.type, {
            expiration: 1000 * 60 * 10,
            queue: QUEUES.DRAW_TELEGRAM_MESSAGE_QUEUE,
        });
        this.replyMarkup = replyMarkup;
        this.options = options;
    }

    public serialize(): EditChatMessageReplyMarkupEvent.Serialized {
        return {
            ...super.serialize(),
            replyMarkup: this.replyMarkup,
            options: this.options,
        };
    }
}

namespace EditChatMessageReplyMarkupEvent {
    export interface Serialized extends AmqpEvent.Serialized {
        replyMarkup: InlineKeyboardMarkup;
        options?: EditMessageReplyMarkupOptions;
    }
}

export default EditChatMessageReplyMarkupEvent;
