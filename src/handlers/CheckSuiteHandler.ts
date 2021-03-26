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

import WebHook from "../entities/WebHook";
import Bot from "../core/Bot";
import {CheckRun, CheckSuite} from "github-webhook-event-types";
import {Context} from "koa";
import loadTemplate from "../utils/loadTemplate";
import WebHookAmqpHandler from "../core/WebHookAmqpHandler";
import * as moment from "moment";


@WebHookAmqpHandler.Handler("check_suite", 10)
export default class CheckSuiteHandler extends WebHookAmqpHandler {
    protected async handle(payload: CheckSuite, ctx: Context): Promise<void> {
        const {action, check_suite, repository, sender} = payload;

        const webHooks: WebHook[] = await WebHook.find({
            where: {repository: repository.full_name},
            relations: ["chat"],
        });

        for (const webHook of webHooks) {
            if (!CheckSuiteHandler.checkSignature(ctx.request.header["x-hub-signature"], payload, webHook.secret)) {
                continue;
            }

            const template = await loadTemplate("check_suite");
            const message: string = template({
                repository: repository.full_name,
                branch: check_suite.head_branch,
                status: check_suite.status,
                conclusion: check_suite.conclusion,
            }).replace(/  +/g, " ").replace(/\n +/g, "\n");

            await Bot.getCurrent().sendMessage(webHook.chat.chatId, message, {
                parse_mode: "HTML",
            });
        }
    }
}
