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

export default async function issueEvent(payload: Issues): Promise<void> {
    const {action, issue, repository} = payload;

    const message = [
        repository.full_name,
        `Issue ${issue.state}.   #${issue.number}`,
        `${issue.title}`,
        `${issue.body}`,
        `--------`,
        `Opened by: ${issue.user.login}`,
        `Assigners: ${issue.assignee}`,
        `--------`,
        issue.labels.map(label => label.name).join(" "),
        `--------`,
        `milestone: ${issue.milestone}`,
    ].join("\n");

    const webHooks: WebHook[] = await WebHook.find({where: {repository: repository.full_name}});

    for (const webHook of webHooks) {
        await Bot.sendMessage(webHook.chatId, message);
    }
}