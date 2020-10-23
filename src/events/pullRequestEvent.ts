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

import {PullRequest} from "github-webhook-event-types";
import {Context} from "koa";
import WebHook from "../entities/WebHook";
import * as Crypto from "crypto";
import getAkaAlias from "../core/getAkaAlias";
import useIssue from "../core/useIssue";
import {Bot} from "../core/Bot";
import Issue from "../entities/Issue";

export default async function pullRequestEvent(payload: PullRequest, ctx: Context) {
    const {action, pull_request: pullRequest, repository} = payload;

    const webHooks: WebHook[] = await WebHook.find({where: {repository: repository.full_name}});

    for (const webHook of webHooks) {
        const externalSignature = ctx.request.header["x-hub-signature"];
        const expectedSignature = "sha1=" + Crypto.createHmac("sha1", webHook.secret)
            .update(JSON.stringify(payload))
            .digest("hex");
        if (expectedSignature !== externalSignature) {
            continue;
        }
        let assignees: string = (await Promise.all(
                pullRequest.assignees.map(assignee => getAkaAlias(assignee.login, webHook.chatId)))
        ).join(" ");

        let requestedReviewers: string = (await Promise.all(
                pullRequest.requested_reviewers.map(assignee => getAkaAlias(assignee.login, webHook.chatId)))
        ).join(" ");


        const message = [
            `[${repository.full_name} #${pullRequest.number}](${pullRequest.html_url})`,
            `#PR _${pullRequest.state}_ *${pullRequest.mergeable_state}*`,
            `Review comments: ${pullRequest.review_comments}`,
            `*${pullRequest.title}*`,
            pullRequest.body,
            ``,
            `*Commits: ${pullRequest.commits}*`,
            `-- Assignees ---------`,
            `Opened by: ${await getAkaAlias(pullRequest.user.login, webHook.chatId)}`,
            assignees && `Assigners: ${assignees}`,
            pullRequest.labels.length ? `-- Labels ------------` : undefined,
            pullRequest.labels.length ? pullRequest.labels.map(label => `*${label.name}*`).join("\n") : undefined,
            requestedReviewers && `-- Review requested --`,
            requestedReviewers,
        ].join("\n");

        try {
            const messageId = await useIssue(pullRequest.id, webHook.chatId);
            await Bot.editMessageText(message, {chat_id: webHook.chatId, message_id: messageId, parse_mode: "Markdown"});
        } catch (error) {
            const result = await Bot.sendMessage(webHook.chatId, message, {parse_mode: "Markdown"});
            const newIssue = new Issue();
            newIssue.chatId = webHook.chatId;
            newIssue.messageId = result.message_id;
            newIssue.issueId = pullRequest.id;
            await newIssue.save();
        }
    }

}
