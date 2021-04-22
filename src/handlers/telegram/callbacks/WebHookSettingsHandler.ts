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

import CallbackQueryDispatcher from "../../../core/amqp/CallbackQueryDispatcher";
import {CallbackQuery} from "node-telegram-bot-api";
import JSONObject from "../../../interfaces/JSONObject";
import WebHook from "../../../entities/WebHook";
import AMQPAck from "../../../errors/AMQPAck";
import DrawWebHookSettingsEvent from "../../../events/draw/DrawWebHookSettingsEvent";

export default class WebHookSettingsHandler {
    @CallbackQueryDispatcher.CallbackQueryHandler("webhook.:id.settings.:setting.:value")
    public static async setter(query: CallbackQuery, params: JSONObject): Promise<void> {
        const {id, setting, value} = params;
        if (!query.message?.message_id) throw new AMQPAck(`No message id provided.`);

        const entity: WebHook.WebHookSettings | undefined = await WebHook.WebHookSettings.findOne({
            where: {webhook: +id},
        });

        if (!entity) throw new AMQPAck("Entity not found.");

        switch (setting) {
            case "track_pushes":
                entity.trackPushes = value === "on";
                break;
            case "track_free_ci":
                entity.trackFreeCI = value === "on";
                break;
            case "track_pull_request_ci":
                entity.trackPullRequestCI = value === "on";
                break;
            default:
                throw new AMQPAck(`Invalid setting name ${setting}.`);
        }
        await entity.save();
        await new DrawWebHookSettingsEvent(id, query.message.message_id).enqueue();
    }
}
