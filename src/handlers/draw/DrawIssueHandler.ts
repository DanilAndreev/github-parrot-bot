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

import WebHookAmqpHandler from "../../core/WebHookAmqpHandler";
import AmqpHandler from "../../core/AmqpHandler";
import Issue from "../../entities/Issue";
import Bot from "../../core/Bot";
import loadTemplate from "../../utils/loadTemplate";
import etelegramIgnore from "../../utils/etelegramIgnore";
import {QUEUES} from "../../globals";
import {Message} from "node-telegram-bot-api";
import {getConnection} from "typeorm";
import AmqpDispatcher from "../../core/AmqpDispatcher";

@WebHookAmqpHandler.Handler(QUEUES.ISSUE_SHOW_QUEUE, 10)
@Reflect.metadata("amqp-handler-type", "draw-event-handler")
export default class DrawIssueHandler extends AmqpHandler {
    protected async handle(content: {issue: number}): Promise<void | boolean> {
        const {issue} = content;

        const entity: Issue | undefined = await Issue.findOne({
            where: {id: issue},
            relations: ["webhook", "chat", "chatMessage"],
        });
        if (!entity) return;

        const template = await loadTemplate("issue");
        const text: string = template(entity).replace(/  +/g, " ").replace(/\n +/g, "\n");

        try {
            const issueMessage: Issue.IssueMessage = new Issue.IssueMessage();
            issueMessage.issue = entity;
            await getConnection().transaction(async transaction => {
                if (entity) {
                    await transaction.save(issueMessage);
                    const newMessage: Message = await Bot.getCurrent().sendMessage(entity.chat.chatId, text, {
                        parse_mode: "HTML",
                        reply_markup: {
                            inline_keyboard: [[{text: "View on GitHub", url: entity.info.html_url}]],
                        },
                    });
                    issueMessage.messageId = newMessage.message_id;
                    await transaction.save(issueMessage);
                }
            });
        } catch (error) {
            try {
                await Bot.getCurrent().editMessageText(text, {
                    chat_id: entity.chat.chatId,
                    message_id: entity.chatMessage.messageId,
                    parse_mode: "HTML",
                    reply_markup: {
                        inline_keyboard: [[{text: "View on GitHub", url: entity.info.html_url}]],
                    },
                });
            } catch (err) {
                if (!etelegramIgnore(err)) {
                    if (entity.chatMessage) await entity.chatMessage.remove();
                    await AmqpDispatcher.getCurrent().sendToQueue(QUEUES.ISSUE_SHOW_QUEUE, content);
                }
            }
        }
    }
}
