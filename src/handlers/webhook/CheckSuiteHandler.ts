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
import {CheckSuite as CheckSuiteType} from "github-webhook-event-types";
import WebHookAmqpHandler from "../../core/amqp/WebHookAmqpHandler";
import CheckSuite from "../../entities/CheckSuite";
import PullRequest from "../../entities/PullRequest";
import {getConnection} from "typeorm";
import AmqpDispatcher from "../../core/amqp/AmqpDispatcher";
import {QUEUES} from "../../globals";
import AMQPAck from "../../errors/AMQPAck";
import DrawPullRequestEvent from "../../events/draw/DrawPullRequestEvent";
import DrawCheckSuiteEvent from "../../events/draw/DrawCheckSuiteEvent";

@WebHookAmqpHandler.Handler("check_suite", 10)
@Reflect.metadata("amqp-handler-type", "github-event-handler")
export default class CheckSuiteHandler extends WebHookAmqpHandler {
    public async handleHook(webHook: WebHook, payload: CheckSuiteType, draw: boolean = true): Promise<boolean | void> {
        const {action, check_suite, repository, sender} = payload;

        if (check_suite.pull_requests.length) {
            if (!webHook.settings.trackPullRequestCI)
                throw new AMQPAck("WebHook setting 'trackPullRequestCI' is disabled.");
        } else {
            if (!webHook.settings.trackFreeCI)
                throw new AMQPAck("WebHook setting 'trackFreeCI' is disabled.");
        }

        let pullRequest: PullRequest | undefined = undefined;
        if (check_suite.pull_requests.length) {
            pullRequest = await PullRequest.findOne({
                where: {pullRequestId: check_suite.pull_requests[0].id, chat: webHook.chat},
            });
        }

        const info: CheckSuite.Info = {
            branch: check_suite.head_branch,
            status: check_suite.status,
            conclusion: check_suite.conclusion,
        };

        let entityId: number = NaN;
        try {
            let entity: CheckSuite = new CheckSuite();
            entity.info = info;
            entity.headSha = check_suite.head_sha;
            entity.suiteId = check_suite.id;
            entity.chat = webHook.chat;
            entity.webhook = webHook;
            entity.pullRequest = pullRequest || undefined;
            await getConnection().transaction(async transaction => {
                entity = await transaction.save(entity);
                if (pullRequest)
                    await transaction
                        .getRepository(CheckSuite)
                        .createQueryBuilder()
                        .delete()
                        .where("pullRequest = :pullRequest", {pullRequest: pullRequest.id})
                        .andWhere("headSha != :headSha", {headSha: check_suite.head_sha})
                        .execute();
            });
            entityId = entity.id;
        } catch (error) {
            const entity: CheckSuite | undefined = await CheckSuite.findOne({
                where: {chat: webHook.chat, suiteId: check_suite.id},
            });
            if (entity) {
                entity.info = info;
                await getConnection().transaction(async transaction => {
                    await transaction.save(entity);
                    if (pullRequest)
                        await transaction
                            .getRepository(CheckSuite)
                            .createQueryBuilder()
                            .delete()
                            .where("pullRequest = :pullRequest", {pullRequest: pullRequest.id})
                            .andWhere("headSha != :headSha", {headSha: check_suite.head_sha})
                            .execute();
                });
                entityId = entity.id;
            }
        } finally {
            if (draw) {
                if (pullRequest) {
                    await new DrawPullRequestEvent(pullRequest.id).enqueue();
                } else {
                    await new DrawCheckSuiteEvent(entityId).enqueue();
                }
            }
        }
    }
}
