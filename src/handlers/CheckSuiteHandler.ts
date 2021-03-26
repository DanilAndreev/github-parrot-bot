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
import {CheckSuite as CheckSuiteType} from "github-webhook-event-types";
import {Context} from "koa";
import loadTemplate from "../utils/loadTemplate";
import WebHookAmqpHandler from "../core/WebHookAmqpHandler";
import CheckSuite from "../entities/CheckSuite";
import {Message} from "node-telegram-bot-api";


@WebHookAmqpHandler.Handler("check_suite", 10)
export default class CheckSuiteHandler extends WebHookAmqpHandler {
    protected async handle(payload: CheckSuiteType, ctx: Context): Promise<void> {
        const {action, check_suite, repository, sender} = payload;

        const webHooks: WebHook[] = await WebHook.find({
            where: {repository: repository.full_name},
            relations: ["chat"],
        });

        for (const webHook of webHooks) {
            if (!CheckSuiteHandler.checkSignature(ctx.request.header["x-hub-signature"], payload, webHook.secret)) {
                continue;
            }

            const template = await loadTemplate("check_suite_new");

            let suite: CheckSuite | null = await CheckSuiteHandler.useCheckSuite(payload.check_suite.id, webHook.chat.chatId);
            if (suite) {
                // const message: string = template({
                //     repository: repository.full_name,
                //     branch: check_suite.head_branch,
                //     status: check_suite.status,
                //     conclusion: check_suite.conclusion,
                // }).replace(/  +/g, " ").replace(/\n +/g, "\n");
                const message: string = template(suite)
                    .replace(/  +/g, " ")
                    .replace(/\n +/g, "\n");

                await Bot.getCurrent().editMessageText(message, {
                    chat_id: webHook.chat.chatId,
                    message_id: suite.messageId,
                    parse_mode: "HTML",
                });

                suite.status = check_suite.status;
                suite.conclusion = check_suite.conclusion;
            } else {
                // const message: string = template({
                //     repository: repository.full_name,
                //     branch: check_suite.head_branch,
                //     status: check_suite.status,
                //     conclusion: check_suite.conclusion,
                // }).replace(/  +/g, " ").replace(/\n +/g, "\n");

                suite = new CheckSuite();
                suite.chat = webHook.chat;
                suite.branch = check_suite.head_branch;
                suite.webhook = webHook;
                suite.suiteId = check_suite.id;
                suite.status = check_suite.status;
                suite.conclusion = check_suite.conclusion;

                const message: string = template(suite)
                    .replace(/  +/g, " ")
                    .replace(/\n +/g, "\n");

                const chatMessage: Message = await Bot.getCurrent().sendMessage(webHook.chat.chatId, message, {
                    parse_mode: "HTML",
                });

                suite.messageId = chatMessage.message_id;
            }
            if (suite.status === "completed")
                await suite?.save()
            else
                await suite.remove();
        }
    }
}
