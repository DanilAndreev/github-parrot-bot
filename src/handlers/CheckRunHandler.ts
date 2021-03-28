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
import {CheckRun as CheckRunType} from "github-webhook-event-types";
import {Context} from "koa";
import loadTemplate from "../utils/loadTemplate";
import WebHookAmqpHandler from "../core/WebHookAmqpHandler";
import * as moment from "moment";
import CheckSuite from "../entities/CheckSuite";
import {Message} from "node-telegram-bot-api";
import CheckRun from "../entities/CheckRun";
import PullRequest from "../entities/PullRequest";
import {getConnection} from "typeorm";
import PullRequestsHandler from "./PullRequestsHandler";
import CheckSuiteHandler from "./CheckSuiteHandler";


@WebHookAmqpHandler.Handler("check_run", 10)
export default class CheckRunHandler extends WebHookAmqpHandler {
    protected async handle(payload: CheckRunType, ctx: Context): Promise<void> {
        const {action, check_run, repository, sender} = payload;

        const webHooks: WebHook[] = await WebHook.find({
            where: {repository: repository.full_name},
            relations: ["chat"],
        });

        for (const webHook of webHooks) {
            if (!CheckRunHandler.checkSignature(ctx.request.header["x-hub-signature"], payload, webHook.secret)) {
                continue;
            }

            // const template = await loadTemplate("check_suite_new");
            //
            // // const message: string = template({
            // //     repository: repository.full_name,
            // //     name: check_run.name,
            // //     status: check_run.status,
            // //     startedAt: moment(check_run.started_at).format("ll")
            // // }).replace(/  +/g, " ").replace(/\n +/g, "\n");
            //
            // let suite: CheckSuite | null = await CheckRunHandler.useCheckSuite(check_run.check_suite.id, webHook.chat.chatId);
            //
            // if (suite) {
            //     const message: string = template(suite)
            //         .replace(/  +/g, " ")
            //         .replace(/\n +/g, "\n");
            //
            //     suite.status = check_run.check_suite.status;
            //     suite.conclusion = check_run.check_suite.conclusion;
            // } else {
            //     suite = new CheckSuite();
            //
            //     const message: string = template(suite)
            //         .replace(/  +/g, " ")
            //         .replace(/\n +/g, "\n");
            //
            //
            //     const newMessage: Message = await Bot.getCurrent().sendMessage(webHook.chat.chatId, message, {
            //         parse_mode: "HTML",
            //     });
            //
            // }
            // if (suite.status !== "completed") {
            //     await suite?.save();
            //     const run: CheckRun = new CheckRun();
            //     run.status = check_run.status;
            //     run.name = check_run.name;
            //     run.suite = suite;
            //     await run.save();
            // } else {
            //     await suite.remove();
            // }


            let suite: CheckSuite | undefined = await CheckSuite.findOne({
                where: {suiteId: check_run.check_suite.id, chat: webHook.chat},
                relations: ["pullRequest", "chat", "runs"]
            });

            let pullRequest: PullRequest | undefined = undefined;
            if (check_run.check_suite.pull_requests.length) {
                pullRequest = await PullRequest.findOne({
                    where: {pullRequestId: check_run.check_suite.pull_requests[0].id, chat: webHook.chat}
                });
            }

            if (!suite) {
                suite = new CheckSuite();
                suite.chat = webHook.chat;
                suite.conclusion = check_run.check_suite.conclusion;
                suite.status = check_run.check_suite.status;
                suite.suiteId = check_run.check_suite.id;
                suite.branch = check_run.check_suite.head_branch;
                suite.headSha = check_run.check_suite.head_sha;
                suite.runs = [];
                if (pullRequest) {
                    suite.pullRequest = pullRequest;
                }
            }

            let entity: CheckRun | undefined = await CheckRun.findOne({where: {runId: check_run.id}});
            if (!entity) {
                entity = new CheckRun();
                entity.suite = suite;
                entity.runId = check_run.id;
            }
            entity.name = check_run.name;
            entity.status = check_run.status;

            try {
                if (!suite.pullRequest) {
                    suite.runs.push(entity);
                    suite.messageId = await CheckSuiteHandler.showCheckSuite(suite, webHook.chat.chatId, suite.messageId);
                    suite.messageIdUpdatedAt = new Date().getTime();
                }
            } catch (error) {
            }

            await getConnection().transaction(async transaction => {
                suite = await transaction.save(suite);
                entity = await transaction.save(entity);
                if (pullRequest) {
                    await transaction
                        .getRepository(CheckSuite)
                        .createQueryBuilder()
                        .delete()
                        .where(
                            "pullRequest = :pullRequest and headSha != :head_sha",
                            {
                                head_sha: check_run.check_suite.head_sha,
                                pullRequest: pullRequest.id,
                            }
                        )
                        .execute();
                }
            });

            try {
                if (pullRequest) {
                    await PullRequestsHandler.showPullRequest(pullRequest.id, false);
                }
            } catch (error) {
                // TODO: Ask node-telegram-bot-api developer about better statuses for errors.
                if (error.code !== "ETELEGRAM" || !error.message.includes("message is not modified")) {
                    throw error;
                }
            }
        }
    }
}
