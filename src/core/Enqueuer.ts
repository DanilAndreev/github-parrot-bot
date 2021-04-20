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
    CallbackQuery,
    EditMessageCaptionOptions,
    EditMessageReplyMarkupOptions,
    EditMessageTextOptions,
    InlineKeyboardMarkup,
    Message,
    SendMessageOptions,
} from "node-telegram-bot-api";
import {QUEUES} from "../globals";
import JSONObject from "../interfaces/JSONObject";

/**
 * Enqueuer - class for queuing AMQP messages with function interface.
 * @class
 * @author Danil Andreev
 */
class Enqueuer {
    public static async drawPullRequest(pullRequest: number, forceNewMessage: boolean = false): Promise<void> {
        await AmqpDispatcher.getCurrent().sendToQueue(
            QUEUES.PULL_REQUEST_SHOW_QUEUE,
            {
                pullRequest,
                forceNewMessage,
            },
            {expiration: 1000 * 60 * 30}
        );
    }

    public static async drawCheckSuite(checkSuite: number, forceNewMessage: boolean = false): Promise<void> {
        await AmqpDispatcher.getCurrent().sendToQueue(
            QUEUES.CHECK_SUITE_SHOW_QUEUE,
            {
                checkSuite,
                forceNewMessage,
            },
            {expiration: 1000 * 60 * 30}
        );
    }

    public static async drawIssue(issue: number, forceNewMessage: boolean = false): Promise<void> {
        await AmqpDispatcher.getCurrent().sendToQueue(
            QUEUES.ISSUE_SHOW_QUEUE,
            {
                issue,
                forceNewMessage,
            },
            {expiration: 1000 * 60 * 30}
        );
    }

    public static async sendChatMessage(
        chatId: string | number,
        text: string,
        options?: SendMessageOptions
    ): Promise<void> {
        await AmqpDispatcher.getCurrent().sendToQueue<Enqueuer.AMQPEvent>(
            QUEUES.DRAW_TELEGRAM_MESSAGE_QUEUE,
            {
                type: "send-chat-message",
                chatId,
                text,
                options,
            },
            {expiration: 1000 * 60 * 10}
        );
    }

    public static async editMessageText(text: string, options?: EditMessageTextOptions): Promise<void> {
        await AmqpDispatcher.getCurrent().sendToQueue<Enqueuer.EditMessageTextEvent>(
            QUEUES.DRAW_TELEGRAM_MESSAGE_QUEUE,
            {
                type: "edit-message-text",
                text,
                options,
            },
            {expiration: 1000 * 60 * 10}
        );
    }

    public static async editMessageReplyMarkup(
        replyMarkup: InlineKeyboardMarkup,
        options?: EditMessageReplyMarkupOptions
    ): Promise<void> {
        await AmqpDispatcher.getCurrent().sendToQueue<Enqueuer.EditMessageReplyMarkupEvent>(
            QUEUES.DRAW_TELEGRAM_MESSAGE_QUEUE,
            {
                type: "edit-message-reply-markup",
                replyMarkup,
                options,
            },
            {expiration: 1000 * 60 * 10}
        );
    }

    public static async editMessageLiveLocation(
        latitude: number,
        longitude: number,
        options?: EditMessageCaptionOptions
    ): Promise<void> {
        await AmqpDispatcher.getCurrent().sendToQueue<Enqueuer.EditMessageLiveLocationEvent>(
            QUEUES.DRAW_TELEGRAM_MESSAGE_QUEUE,
            {
                type: "edit-message-live-location",
                latitude,
                longitude,
                options,
            },
            {expiration: 1000 * 60 * 10}
        );
    }

    public static async deleteChatMessage(
        chatId: string | number,
        messageId: string,
        options?: JSONObject,
        showMessageOnError?: boolean
    ): Promise<void> {
        await AmqpDispatcher.getCurrent().sendToQueue<Enqueuer.DeleteChatMessageEvent>(
            QUEUES.DRAW_TELEGRAM_MESSAGE_QUEUE,
            {
                type: "delete-chat-message",
                chatId,
                messageId,
                options,
                showMessageOnError,
            }
        );
    }

    public static async chatCommand(message: Message, match: RegExpMatchArray | null): Promise<void> {
        await AmqpDispatcher.getCurrent().sendToQueue(
            QUEUES.TELEGRAM_CHAT_COMMAND,
            {
                message,
                match,
            },
            {expiration: 1000 * 60 * 10}
        );
    }

    public static async telegramEvent<T extends Message | CallbackQuery>(
        event:
            | "channel_post"
            | "edited_message"
            | "edited_message_text"
            | "edited_message_caption"
            | "edited_channel_post"
            | "edited_channel_post_text"
            | "edited_channel_post_caption"
            | "new_chat_members"
            | "left_chat_member"
            | "callback_query",
        message: T
    ): Promise<void> {
        await AmqpDispatcher.getCurrent().sendToQueue<Enqueuer.TelegramEvent<T>>(QUEUES.TELEGRAM_EVENTS_QUEUE, {
            type: event,
            message,
        });
    }
}

namespace Enqueuer {
    export interface AMQPEvent extends JSONObject {
        type: string;
    }

    export interface SendChatMessageEvent extends AMQPEvent {
        chatId: string | number;
        text: string;
        options?: SendMessageOptions;
    }

    export interface EditMessageTextEvent extends AMQPEvent {
        text: string;
        options?: EditMessageTextOptions;
    }

    export interface EditMessageReplyMarkupEvent extends AMQPEvent {
        replyMarkup: InlineKeyboardMarkup;
        options?: EditMessageReplyMarkupOptions;
    }

    export interface EditMessageLiveLocationEvent extends AMQPEvent {
        latitude: number;
        longitude: number;
        options?: EditMessageCaptionOptions;
    }

    export interface DeleteChatMessageEvent extends AMQPEvent {
        chatId: string | number;
        messageId: string;
        options?: JSONObject;
        showMessageOnError?: boolean;
    }

    export interface TelegramEvent<T = Message> extends AMQPEvent {
        type:
            | "channel_post"
            | "edited_message"
            | "edited_message_text"
            | "edited_message_caption"
            | "edited_channel_post"
            | "edited_channel_post_text"
            | "edited_channel_post_caption"
            | "new_chat_members"
            | "left_chat_member"
            | "callback_query";
        message: T;
    }
}

export default Enqueuer;
