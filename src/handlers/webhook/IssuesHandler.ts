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

import WebHook from "../../entities/WebHook";
import * as moment from "moment";
import Issue from "../../entities/Issue";
import {Issues} from "github-webhook-event-types";
import WebHookAmqpHandler from "../../core/amqp/WebHookAmqpHandler";
import AmqpDispatcher from "../../core/amqp/AmqpDispatcher";
import {QUEUES} from "../../globals";
import AkaGenerator from "../../utils/AkaGenerator";

@WebHookAmqpHandler.Handler("issues", 10)
@Reflect.metadata("amqp-handler-type", "github-event-handler")
export default class IssuesHandler extends WebHookAmqpHandler {
    protected async handleHook(webHook: WebHook, payload: Issues): Promise<boolean | void> {
        const {action, issue, repository} = payload;
        const akaGenerator = new AkaGenerator(webHook.chat.chatId);

        const info: Issue.Info = {
            assignees: await akaGenerator.getAkas(issue.assignees.map(assignee => assignee.login)),
            labels: issue.labels.map(label => ({name: label.name})),
            opened_by: await akaGenerator.getAka(issue.user.login),
            state: issue.state,
            tag: issue.number,
            title: issue.title,
            body: issue.body,
            html_url: issue.html_url,
            milestone: issue.milestone
                ? {
                    title: issue.milestone.title,
                    due_on: moment(issue.milestone.due_on).format("ll"),
                }
                : undefined,
        };

        let entityId: number = NaN;
        try {
            let entity: Issue = new Issue();
            entity.info = info;
            entity.chat = webHook.chat;
            entity.webhook = webHook;
            entity.issueId = issue.id;
            entity = await entity.save();
            entityId = entity.id;
        } catch (error) {
            const entity: Issue | undefined = await Issue.findOne({
                where: {chat: webHook.chat, issueId: issue.id},
            });
            if (entity) {
                entity.info = info;
                await entity.save();
                entityId = entity.id;
            }
        } finally {
            await AmqpDispatcher.getCurrent().sendToQueue(
                QUEUES.ISSUE_SHOW_QUEUE,
                {issue: entityId},
                {expiration: 1000 * 60 * 30}
            );
        }
    }
}
