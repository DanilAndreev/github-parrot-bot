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

export default async function issueEvent(payload: Issues): Promise<void> {
    const {action, issue, repository} = payload;

    console.log(`Issue event: `, issue.number);

    const webHooks: WebHook[] = await WebHook.find({where: {repository: repository.full_name}});

    console.log("Found chats: ", webHooks.map(hook => hook.chatId).join(" "));

    for (const webHook of webHooks) {
        let assignees: string = (await Promise.all(
            issue.assignees.map(assignee => getAkaAlias(assignee.login, webHook.chatId)))
        ).join(" ");

        const milestone = issue.milestone;

        const message = [
            `<a src="${issue.html_url}"><b>${repository.full_name} #${issue.number}</b></a>`,
            `Issue <i>${issue.state}</i>`,
            `<b>${issue.title}</b>`,
            issue.body,
            `--------`,
            `Opened by: <b>${await getAkaAlias(issue.user.login, webHook.chatId)}</b>`,
            assignees && `Assigners: <b>${assignees}</b>`,
            issue.labels && `--------`,
            issue.labels && issue.labels.map(label => `<b>${label.name}</b>`).join("\n"),
            milestone && `--------`,
            milestone && `Milestone: <i>${milestone.title} ${moment(milestone.due_on).format("ll") || ""}</i>`,
        ].join("\n");
        await Bot.sendMessage(webHook.chatId, message, {parse_mode: "MarkdownV2"});
    }
}
