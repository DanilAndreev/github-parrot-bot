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

import CallbackQueryDispatcher from "../../../core/CallbackQueryDispatcher";
import {CallbackQuery} from "node-telegram-bot-api";
import JSONObject from "../../../interfaces/JSONObject";
import PullRequest from "../../../entities/PullRequest";
import {Logger} from "../../../core/Logger";
import DrawPullRequestEvent from "../../../events/draw/DrawPullRequestEvent";

export default class PullRequestCallbacksHandler {
    @CallbackQueryDispatcher.CallbackQueryHandler("pull_request.:id.maximize", {exact: true})
    public static async maximize(query: CallbackQuery, params: JSONObject<{ id: string }>): Promise<void> {
        Logger?.debug(`Handling Telegram callback query: "${query.data}" | PullRequestCallbacksHandler.maximize()`);
        const {id} = params;
        if (!query.message) return;
        const entity: PullRequest | undefined = await PullRequest.findOne({
            where: {
                pullRequestId: +id,
                chat: query.message.chat.id
            }
        });
        if (!entity) return;

        entity.minimized = false;
        await entity.save();
        await new DrawPullRequestEvent(entity.id)
    }

    @CallbackQueryDispatcher.CallbackQueryHandler("pull_request.:id.minimize", {exact: true})
    public static async minimize(query: CallbackQuery, params: JSONObject<{ id: string }>): Promise<void> {
        Logger?.debug(`Handling Telegram callback query: "${query.data}" | PullRequestCallbacksHandler.minimize()`);
        const {id} = params;
        if (!query.message) return;
        const entity: PullRequest | undefined = await PullRequest.findOne({
            where: {
                pullRequestId: +id,
                chat: query.message.chat.id
            }
        });
        if (!entity) return;

        entity.minimized = true;
        await entity.save();
        await new DrawPullRequestEvent(entity.id)
    }
}
