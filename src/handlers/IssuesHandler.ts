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

import AmqpHandler from "../core/AmqpHandler";
import WebHook from "../entities/WebHook";
import * as Crypto from "crypto";
import getAkaAlias from "../utils/getAkaAlias";
import * as moment from "moment";
import {Moment} from "moment";
import {readFileSync} from "fs";
import root from "../utils/root";
import * as Handlebars from "handlebars";
import Bot from "../core/Bot";
import Issue from "../entities/Issue";
import {Issues} from "github-webhook-event-types";
import {Context} from "koa";
import {AMQP_ISSUES_QUEUE} from "../globals";
import {SendMessageOptions} from "node-telegram-bot-api";


@AmqpHandler.Handler(AMQP_ISSUES_QUEUE, 10)
export default class IssuesHandler extends AmqpHandler {
    protected async handle(payload: Issues, ctx: Context): Promise<void> {
        const {action, issue, repository} = payload;

        const webHooks: WebHook[] = await WebHook.find({where: {repository: repository.full_name}});

        for (const webHook of webHooks) {
            const externalSignature = ctx.request.header["x-hub-signature"];
            const expectedSignature = "sha1=" + Crypto.createHmac("sha1", webHook.secret)
                .update(JSON.stringify(payload))
                .digest("hex");
            if (expectedSignature !== externalSignature) {
                continue;
            }

            const template_text: string = readFileSync(root + "/templates/issue.hbs").toString();
            const template = Handlebars.compile(template_text, {preventIndent: true});

            const message: string = template({
                repository: repository.full_name,
                tag: issue.number,
                state: issue.state,
                title: issue.title.trim(),
                body: issue.body.trim(),
                opened_by: issue.user.login,
                assignees: issue.assignees.map(item => ({login: item.login})),
                labels: issue.labels,
                milestone: issue.milestone ? {
                    ...issue.milestone,
                    due_on: moment(issue.milestone.due_on).format("ll")
                } : undefined,
            }).replace(/  +/g, " ").replace(/\n +/g, "\n");

            try {
                const messageId = await IssuesHandler.useIssue(issue.id, webHook.chatId);
                await Bot.getCurrent().editMessageText(message, {
                    chat_id: webHook.chatId,
                    message_id: messageId,
                    parse_mode: "HTML"
                });
            } catch (error) {
                const result = await Bot.getCurrent().sendMessage(webHook.chatId, message, {
                    parse_mode: "HTML",
                    reply_markup: {
                        inline_keyboard: [
                            [{text: "View on GitHub", url: issue.html_url}],
                        ]
                    }
                });
                const newIssue = new Issue();
                newIssue.chatId = webHook.chatId;
                newIssue.messageId = result.message_id;
                newIssue.issueId = issue.id;
                await newIssue.save();
            }
        }
    }
}
