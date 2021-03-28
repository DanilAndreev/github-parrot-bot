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

import {Context} from "koa";
import {PullRequest as PullRequestType} from "github-webhook-event-types";
import WebHook from "../entities/WebHook";
import Bot from "../core/Bot";
import loadTemplate from "../utils/loadTemplate";
import WebHookAmqpHandler from "../core/WebHookAmqpHandler";
import PullRequest from "../entities/PullRequest";
import CommandError from "../errors/CommandError";
import CheckSuite from "../entities/CheckSuite";


@WebHookAmqpHandler.Handler("pull_request", 10)
export default class PullRequestsHandler extends WebHookAmqpHandler {
    protected async handle(payload: PullRequestType, ctx: Context): Promise<void> {
        const {action, pull_request: pullRequest, repository} = payload;

        const webHooks: WebHook[] = await WebHook.find({
            where: {repository: repository.full_name},
            relations: ["chat"]
        });

        for (const webHook of webHooks) {
            if (!PullRequestsHandler.checkSignature(ctx.request.header["x-hub-signature"], payload, webHook.secret)) {
                continue;
            }

            let entity: PullRequest | undefined = await PullRequest.findOne({
                where: {chat: webHook.chat, pullRequestId: pullRequest.id},
                relations: ["chat", "webhook", "checksuits", "checksuits.runs"],
            });

            if (!entity) {
                entity = new PullRequest();
                entity.chat = webHook.chat;
                entity.webhook = webHook;
            }

            entity.pullRequestId = pullRequest.id;
            entity.info = {
                assignees: pullRequest.assignees.map(item => ({login: item.login})),
                body: pullRequest.body,
                html_url: pullRequest.html_url,
                labels: pullRequest.labels.map(item => ({name: item.name})),
                milestone: pullRequest.milestone && {
                    title: pullRequest.milestone.title,
                    due_on: pullRequest.milestone.due_on
                },
                opened_by: pullRequest.user.login,
                requested_reviewers: pullRequest.requested_reviewers.map(item => ({login: item.login})),
                state: pullRequest.state,
                tag: pullRequest.number,
                title: pullRequest.title,
            };

            await CheckSuite
                .createQueryBuilder()
                .delete()
                .where(
                    "pullRequest = :pullRequest and headSha != :head_sha",
                    {
                        head_sha: pullRequest.head.sha,
                        pullRequest: entity.id,
                    }
                )
                .execute();

            entity.checksuits = entity.checksuits.filter(suite => suite.headSha == pullRequest.head.sha);

            try {
                await PullRequestsHandler.showPullRequest(entity);
            } catch (error) {
            }
        }
    }

    public static async showPullRequest(entity_data: PullRequest | number, save: boolean = true): Promise<PullRequest> {
        let updated: boolean = false;
        let entity: PullRequest | undefined;
        if (typeof entity_data == "number") {
            entity = await PullRequest.findOne({
                where: {id: entity_data},
                relations: ["checksuits", "checksuits.runs", "chat"]
            });
        } else {
            entity = entity_data;
        }
        if (!entity)
            throw new CommandError(`Pull request not found.`);

        const template = await loadTemplate("pull_request");
        const message = template(entity)
            .replace(/  +/g, " ")
            .replace(/\n +/g, "\n");

        if (!entity.messageIdUpdatedAt) {
            entity.messageIdUpdatedAt = new Date().getTime();
            updated = true;
        }

        entity.checksuits = entity.checksuits.sort((a: CheckSuite, b: CheckSuite) => {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

        try {
            if (!(entity.messageId && new Date().getTime() - entity.messageIdUpdatedAt < 1000 * 60 * 60))
                throw new Error();
            await Bot.getCurrent().editMessageText(message, {
                chat_id: entity.chat.chatId,
                message_id: entity.messageId,
                parse_mode: "HTML",
                reply_markup: {
                    inline_keyboard: [
                        [{text: "View on GitHub", url: entity.info.html_url}],
                    ]
                }
            });
        } catch (error) {
            // TODO: synchronization problems. Causes multiple messages sending.
            // TODO: Ask node-telegram-bot-api developer about better statuses for errors.
            if (error.code !== "ETELEGRAM" || !error.message.includes("message is not modified")) {
                const newMessage = await Bot.getCurrent().sendMessage(entity.chat.chatId, message, {
                    parse_mode: "HTML",
                    reply_markup: {
                        inline_keyboard: [
                            [{text: "View on GitHub", url: entity.info.html_url}],
                        ]
                    }
                });
                entity.messageId = newMessage.message_id;
                entity.messageIdUpdatedAt = new Date().getTime();
                updated = true;
            }
        } finally {
            if (updated && save)
                entity = await entity.save();
        }
        return entity;
    }
}
