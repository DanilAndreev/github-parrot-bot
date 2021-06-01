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

import WebHookAmqpHandler from "../../core/amqp/WebHookAmqpHandler";
import AmqpHandler from "../../core/amqp/AmqpHandler";
import loadTemplate from "../../utils/loadTemplate";
import etelegramIgnore from "../../utils/etelegramIgnore";
import {QUEUES} from "../../Globals";
import {Message} from "node-telegram-bot-api";
import {getConnection} from "typeorm";
import AmqpDispatcher from "../../core/amqp/AmqpDispatcher";
import CheckSuite from "../../entities/CheckSuite";
import BotSingleton from "../../classes/BotSingleton";

@WebHookAmqpHandler.Handler(QUEUES.CHECK_SUITE_SHOW_QUEUE, 10)
@Reflect.metadata("amqp-handler-type", "draw-event-handler")
export default class DrawCheckSuiteHandler extends AmqpHandler {
    protected async handle(content: {checkSuite: number}): Promise<void | boolean> {
        const {checkSuite} = content;

        const entity: CheckSuite | undefined = await CheckSuite.findOne({
            where: {id: checkSuite},
            relations: ["webhook", "chat", "chatMessage", "pullRequest", "runs"],
        });
        if (!entity) return;

        if (entity.pullRequest) {
            await AmqpDispatcher.getCurrent().sendToQueue(
                QUEUES.CHECK_SUITE_SHOW_QUEUE,
                {pullRequest: entity.pullRequest.id},
                {expiration: 1000 * 60 * 60}
            );
            return true;
        }

        const template = await loadTemplate("check_suite");
        const text: string = template(entity).replace(/  +/g, " ").replace(/\n +/g, "\n");

        try {
            const checkSuiteMessage: CheckSuite.CheckSuiteMessage = new CheckSuite.CheckSuiteMessage();
            checkSuiteMessage.suite = entity;
            await getConnection().transaction(async transaction => {
                if (entity) {
                    await transaction.save(checkSuiteMessage);
                    const newMessage: Message = await BotSingleton.getCurrent().sendMessage(entity.chat.chatId, text, {
                        parse_mode: "HTML",
                    });
                    checkSuiteMessage.messageId = newMessage.message_id;
                    await transaction.save(checkSuiteMessage);
                }
            });
        } catch (error) {
            try {
                await BotSingleton.getCurrent().editMessageText(text, {
                    chat_id: entity.chat.chatId,
                    message_id: entity.chatMessage.messageId,
                    parse_mode: "HTML",
                });
            } catch (err) {
                if (!etelegramIgnore(err)) {
                    if (entity.chatMessage) await entity.chatMessage.remove();
                    await AmqpDispatcher.getCurrent().sendToQueue(QUEUES.CHECK_SUITE_SHOW_QUEUE, content);
                }
            }
        }
    }
}
