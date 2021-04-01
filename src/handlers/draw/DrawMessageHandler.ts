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

import WebHookAmqpHandler from "../../core/WebHookAmqpHandler";
import {QUEUES} from "../../globals";
import AmqpHandler from "../../core/AmqpHandler";
import JSONObject from "../../interfaces/JSONObject";
import Bot from "../../core/Bot";
import {
    EditMessageCaptionOptions,
    EditMessageLiveLocationOptions,
    EditMessageReplyMarkupOptions,
    EditMessageTextOptions,
    SendMessageOptions,
} from "node-telegram-bot-api";
import loadTemplate from "../../utils/loadTemplate";

@WebHookAmqpHandler.Handler(QUEUES.PULL_REQUEST_SHOW_QUEUE, 10)
class DrawMessageHandler extends AmqpHandler {
    // protected async handle(message: DrawMessageHandler.HandlerMessageType): Promise<void | boolean> {
    //
    //
    //
    //     switch (message.type) {
    //
    //     }
    // }
    //
    // protected async sendMessage(text: string, message: DrawMessageHandler.Message): Promise<void> {
    //     try {
    //         await Bot.getCurrent().sendMessage(message.options.chatId);
    //     } catch (error) {
    //     }
    // }
}

namespace DrawMessageEvent {
    export type MessageText<T> = string | string[] | HandlebarsMessageConfig<T>;

    export type HandlerMessageType = Message<| SendMessageOptions
        | EditMessageCaptionOptions
        | EditMessageLiveLocationOptions
        | EditMessageReplyMarkupOptions
        | EditMessageTextOptions>;

    export interface Message<O extends | SendMessageOptions
        | EditMessageCaptionOptions
        | EditMessageLiveLocationOptions
        | EditMessageReplyMarkupOptions
        | EditMessageTextOptions,
        T = never> {
        text: O extends SendMessageOptions ? MessageText<T> : never;
        options: O extends SendMessageOptions ? O : O | undefined;
        type: O extends SendMessageOptions
            ? "send"
            : O extends EditMessageCaptionOptions
                ? "edit-caption"
                : O extends EditMessageLiveLocationOptions
                    ? "edit-live-location"
                    : O extends EditMessageReplyMarkupOptions
                        ? "edit-reply-markup"
                        : O extends EditMessageTextOptions
                            ? "edit-text"
                            : never;
    }

    export interface HandlebarsMessageConfig<T extends JSONObject> {
        template: string | { text: string };
        context: T;
        options?: CompileOptions;
    }
}

export default DrawMessageHandler;
