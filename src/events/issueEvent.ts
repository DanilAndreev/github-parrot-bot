/*
 * Author: Danil Andreev | danssg08@gmail.com | https://github.com/DanilAndreev
 *
 * MIT License
 *
 * Copyright (c) 2020 Danil Andreev
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

import {Issues} from "github-webhook-event-types";
import {Bot} from "../core/Bot";
import WebHook from "../entities/WebHook";
import getAkaAlias from "../core/getAkaAlias";
import moment = require("moment");
import useIssue from "../core/useIssue";
import Issue from "../entities/Issue";
import {Context} from "koa";
import * as Crypto from "crypto";

export default async function issueEvent(payload: Issues, ctx: Context): Promise<void> {
    const {action, issue, repository} = payload;

    const webHooks: WebHook[] = await WebHook.find({where: {repository: repository.full_name}});

    for (const webHook of webHooks) {
        console.log("Looking on chat ", webHook.chatId);
        const externalSignature = ctx.request.header["x-hub-signature"];
        const expectedSignature = "sha1=" + Crypto.createHmac("sha1", webHook.secret)
            .update(JSON.stringify(payload))
            .digest("hex");
        console.log(externalSignature, externalSignature);
        if (expectedSignature !== externalSignature) {
            console.log("Secret is failed");
            continue;
        }

        let assignees: string = (await Promise.all(
            issue.assignees.map(assignee => getAkaAlias(assignee.login, webHook.chatId)))
        ).join(" ");

        const milestone = issue.milestone;

        const message = [
            `[${repository.full_name} #${issue.number}](${issue.html_url})`,
            `#issue _${issue.state}_`,
            `*${issue.title}*`,
            issue.body,
            `-- Assignees --`,
            `Opened by: ${await getAkaAlias(issue.user.login, webHook.chatId)}`,
            assignees && `Assigners: ${assignees}`,
            issue.labels.length ? `-- Labels -----` : undefined,
            issue.labels.length ? issue.labels.map(label => `*${label.name}*`).join("\n") : undefined,
            milestone && `---------------`,
            milestone && `Milestone: _${milestone.title} ${moment(milestone.due_on).format("ll") || ""}_ #milestone${milestone.id}`,
        ].join("\n");

        try {
            const messageId = await useIssue(issue.id, webHook.chatId);
            await Bot.editMessageText(message, {chat_id: webHook.chatId, message_id: messageId, parse_mode: "Markdown"});
        } catch (error) {
            const result = await Bot.sendMessage(webHook.chatId, message, {parse_mode: "Markdown"});
            const newIssue = new Issue();
            newIssue.chatId = webHook.chatId;
            newIssue.messageId = result.message_id;
            newIssue.issueId = issue.id;
            await newIssue.save();
        }
    }
}
