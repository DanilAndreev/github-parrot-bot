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
import Bot from "../../core/Bot";
import Issue from "../../entities/Issue";
import {Issues} from "github-webhook-event-types";
import {Context} from "koa";
import loadTemplate from "../../utils/loadTemplate";
import WebHookAmqpHandler from "../../core/WebHookAmqpHandler";
import Chat from "../../entities/Chat";
import {getConnection, QueryRunner} from "typeorm";
import etelegramIgnore from "../../utils/etelegramIgnore";
import AmqpDispatcher from "../../core/AmqpDispatcher";
import config from "../../config";


@WebHookAmqpHandler.Handler("issues", 10)
export default class IssuesHandler extends WebHookAmqpHandler {
    protected async handleHook(webHook: WebHook, payload: Issues): Promise<boolean | void> {
        const {action, issue, repository} = payload;

        const info: Issue.Info = {
            assignees: issue.assignees.map(item => ({login: item.login})),
            labels: issue.labels.map(label => ({name: label.name})),
            opened_by: issue.user.login,
            state: issue.state,
            tag: issue.number,
            title: issue.title,
            body: issue.body,
            html_url: issue.html_url,
            milestone: issue.milestone ? {
                title: issue.milestone.title,
                due_on: moment(issue.milestone.due_on).format("ll"),
            } : undefined,
        }

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
                where: {chat: webHook.chat, issueId: issue.id}
            });
            if (entity) {
                entity.info = info;
                await entity.save();
                entityId = entity.id;
            }
        } finally {
            await AmqpDispatcher.getCurrent().sendToQueue(
                config.amqp.queues.ISSUE_SHOW_QUEUE || "issue-show-queue",
                {issue: entityId},
                {expiration: 1000 * 60 * 30}
            );
        }
    }

    // protected async handleHook(webHook: WebHook, payload: Issues): Promise<boolean | void> {
    //     const {action, issue, repository} = payload;
    //     const template = await loadTemplate("issue");
    //     const message: string = template({
    //         repository: repository.full_name,
    //         tag: issue.number,
    //         state: issue.state,
    //         title: issue.title.trim(),
    //         body: issue.body.trim(),
    //         opened_by: issue.user.login,
    //         assignees: issue.assignees.map(item => ({login: item.login})),
    //         labels: issue.labels,
    //         milestone: issue.milestone ? {
    //             ...issue.milestone,
    //             due_on: moment(issue.milestone.due_on).format("ll")
    //         } : undefined,
    //     }).replace(/  +/g, " ").replace(/\n +/g, "\n");
    //
    //     try {
    //         let entity: Issue = new Issue();
    //         entity.chat = webHook.chat;
    //         entity.issueId = issue.id;
    //         entity.webhook = webHook;
    //
    //         await getConnection().transaction(async transaction => {
    //             entity = await transaction.save(entity);
    //             const result = await Bot.getCurrent().sendMessage(webHook.chat.chatId, message, {
    //                 parse_mode: "HTML",
    //                 reply_markup: {
    //                     inline_keyboard: [
    //                         [{text: "View on GitHub", url: issue.html_url}],
    //                     ]
    //                 }
    //             });
    //             entity.messageId = result.message_id;
    //             entity = await transaction.save(entity);
    //         });
    //     } catch (error) {
    //         const entity: Issue | undefined = await Issue.findOne({
    //             where: {chat: webHook.chat, issueId: issue.id}
    //         });
    //         if (entity) {
    //             try {
    //                 await Bot.getCurrent().editMessageText(message, {
    //                     chat_id: webHook.chat.chatId,
    //                     message_id: entity.messageId,
    //                     parse_mode: "HTML",
    //                     reply_markup: {
    //                         inline_keyboard: [
    //                             [{text: "View on GitHub", url: issue.html_url}],
    //                         ]
    //                     }
    //                 });
    //             } catch (err) {
    //                 if (!etelegramIgnore(err)) {
    //                     await entity.remove();
    //                     return false;
    //                 }
    //             }
    //         }
    //     }
    // }

    // public static async useIssue(issueId: number, chat: Chat): Promise<number> {
    //     const result: Issue | undefined = await Issue.findOne({where: {chat, issueId}});
    //     if (result) {
    //         if (result?.updatedAt && new Date().getTime() - new Date(result.updatedAt).getTime() > 1000 * 60 * 60) {
    //             await result.remove();
    //             throw new Error("Outdated message id.");
    //         }
    //         return result.messageId;
    //     }
    //     throw new Error("Issue not found.");
    // }
}
