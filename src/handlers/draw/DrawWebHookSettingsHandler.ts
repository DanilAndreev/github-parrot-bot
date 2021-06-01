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

import WebHookAmqpHandler from "../../core/amqp/WebHookAmqpHandler";
import AmqpHandler from "../../core/amqp/AmqpHandler";
import {QUEUES} from "../../Globals";
import {InlineKeyboardMarkup} from "node-telegram-bot-api";
import DrawWebHookSettingsEvent from "../../events/draw/DrawWebHookSettingsEvent";
import WebHook from "../../entities/WebHook";
import BotSingleton from "../../classes/BotSingleton";

@WebHookAmqpHandler.Handler(QUEUES.WEB_HOOK_SETTINGS_SHOW_QUEUE, 10)
@Reflect.metadata("amqp-handler-type", "draw-event-handler")
export default class DrawWebHookSettingsHandler extends AmqpHandler {
    protected async handle(content: DrawWebHookSettingsEvent.Serialized): Promise<void | boolean> {
        const {message, webhook} = content;

        const entity: WebHook | undefined = await WebHook.findOne({
            where: {id: webhook},
            relations: ["settings", "chat"],
        });

        if (!entity) return;

        const replyMarkup: InlineKeyboardMarkup = {
            inline_keyboard: [
                [
                    {
                        text: "Track free CI: " + (entity.settings.trackFreeCI ? "ON" : "OFF"),
                        callback_data: `webhook.${entity.id}.settings.track_free_ci.${
                            entity.settings.trackFreeCI ? "off" : "on"
                        }`,
                    },
                ],
                [
                    {
                        text: "Track pushes: " + (entity.settings.trackPushes ? "ON" : "OFF"),
                        callback_data: `webhook.${entity.id}.settings.track_pushes.${
                            entity.settings.trackPushes ? "off" : "on"
                        }`,
                    },
                ],
                [
                    {
                        text: "Track Pull Request CI: " + (entity.settings.trackPullRequestCI ? "ON" : "OFF"),
                        callback_data: `webhook.${entity.id}.settings.track_pull_request_ci.${
                            entity.settings.trackPullRequestCI ? "off" : "on"
                        }`,
                    },
                ],
            ],
        };

        if (message) {
            try {
                await BotSingleton.getCurrent().editMessageText(`Settigns for ${entity.repository}`, {
                    chat_id: entity.chat.chatId,
                    message_id: message,
                    reply_markup: replyMarkup,
                });
            } catch (error) {}
        } else {
            try {
                await BotSingleton.getCurrent().sendMessage(entity.chat.chatId, `Settigns for ${entity.repository}`, {
                    reply_markup: replyMarkup,
                });
            } catch (error) {}
        }
    }
}
