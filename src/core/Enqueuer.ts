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

import AmqpDispatcher from "./AmqpDispatcher";
import {
    EditMessageCaptionOptions,
    EditMessageReplyMarkupOptions,
    EditMessageTextOptions,
    InlineKeyboardMarkup,
    SendMessageOptions,
} from "node-telegram-bot-api";
import {QUEUES} from "../globals";

class Enqueuer {
    protected amqp: AmqpDispatcher;

    constructor(amqp: AmqpDispatcher) {
        this.amqp = amqp;
    }

    public async drawPullRequest(pullRequest: number, forceNewMessage: boolean = false): Promise<void> {
        await this.amqp.sendToQueue(
            QUEUES.PULL_REQUEST_SHOW_QUEUE,
            {
                pullRequest,
                forceNewMessage,
            },
            {expiration: 1000 * 60 * 30}
        );
    }

    public async drawCheckSuite(checkSuite: number, forceNewMessage: boolean = false): Promise<void> {
        await this.amqp.sendToQueue(
            QUEUES.CHECK_SUITE_SHOW_QUEUE,
            {
                checkSuite,
                forceNewMessage,
            },
            {expiration: 1000 * 60 * 30}
        );
    }

    public async drawIssue(issue: number, forceNewMessage: boolean = false): Promise<void> {
        await this.amqp.sendToQueue(
            QUEUES.ISSUE_SHOW_QUEUE,
            {
                issue,
                forceNewMessage,
            },
            {expiration: 1000 * 60 * 30}
        );
    }

    public async sendChatMessage(chatId: string | number, text: string, options?: SendMessageOptions): Promise<void> {
        await this.amqp.sendToQueue(
            "messages",
            {
                type: "send-chat-message",
                chatId,
                text,
                options,
            },
            {expiration: 1000 * 60 * 10}
        );
    }

    public async editMessageText(text: string, options?: EditMessageTextOptions): Promise<void> {
        await this.amqp.sendToQueue(
            "messages",
            {
                type: "edit-message-text",
                text,
                options,
            },
            {expiration: 1000 * 60 * 10}
        );
    }

    public async editMessageReplyMarkup(
        replyMarkup: InlineKeyboardMarkup,
        options?: EditMessageReplyMarkupOptions
    ): Promise<void> {
        await this.amqp.sendToQueue(
            "messages",
            {
                type: "edit-message-reply-markup",
                replyMarkup,
                options,
            },
            {expiration: 1000 * 60 * 10}
        );
    }

    public async editMessageLiveLocation(
        latitude: number,
        longitude: number,
        options?: EditMessageCaptionOptions
    ): Promise<void> {
        await this.amqp.sendToQueue(
            "messages",
            {
                type: "send-message",
                latitude,
                longitude,
                options,
            },
            {expiration: 1000 * 60 * 10}
        );
    }
}

export default Enqueuer;
