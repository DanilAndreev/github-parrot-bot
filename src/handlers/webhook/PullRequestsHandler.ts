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

import {PullRequest as PullRequestType} from "github-webhook-event-types";
import WebHook from "../../entities/WebHook";
import WebHookAmqpHandler from "../../core/WebHookAmqpHandler";
import PullRequest from "../../entities/PullRequest";
import AmqpDispatcher from "../../core/AmqpDispatcher";
import {QUEUES} from "../../globals";

@WebHookAmqpHandler.Handler("pull_request", 10)
export default class PullRequestsHandler extends WebHookAmqpHandler {
    protected async handleHook(webHook: WebHook, payload: PullRequestType): Promise<boolean | void> {
        const {action, pull_request: pullRequest, repository} = payload;

        const info: PullRequest.Info = {
            assignees: pullRequest.assignees.map(item => ({login: item.login})),
            body: pullRequest.body,
            html_url: pullRequest.html_url,
            labels: pullRequest.labels.map(item => ({name: item.name})),
            milestone: pullRequest.milestone && {
                title: pullRequest.milestone.title,
                due_on: pullRequest.milestone.due_on,
            },
            opened_by: pullRequest.user.login,
            requested_reviewers: pullRequest.requested_reviewers.map(item => ({login: item.login})),
            state: pullRequest.state,
            tag: pullRequest.number,
            title: pullRequest.title,
        };

        let entityId: number = NaN;
        try {
            let entity: PullRequest = new PullRequest();
            entity.chat = webHook.chat;
            entity.webhook = webHook;
            entity.info = info;
            entity.pullRequestId = pullRequest.id;
            entity = await entity.save();
            entityId = entity.id;
        } catch (error) {
            const entity: PullRequest | undefined = await PullRequest.findOne({
                where: {chat: webHook.chat, pullRequestId: pullRequest.id},
            });
            if (entity) {
                entity.info = info;
                await entity.save();
                entityId = entity.id;
            }
        } finally {
            await AmqpDispatcher.getCurrent().sendToQueue(
                QUEUES.PULL_REQUEST_SHOW_QUEUE,
                {pullRequest: entityId},
                {expiration: 1000 * 60 * 30}
            );
        }
    }
}
