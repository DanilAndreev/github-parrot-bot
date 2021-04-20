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

import AmqpHandler from "../../core/AmqpHandler";
import {QUEUES} from "../../globals";
import {Message as AMQPMessage} from "amqplib";
import Enqueuer from "../../core/Enqueuer";
import {CallbackQuery, Message, User} from "node-telegram-bot-api";
import Chat from "../../entities/Chat";
import Collaborator from "../../entities/Collaborator";
import Bot from "../../core/Bot";
import AMQPNack from "../../errors/AMQPNack";
import CallbackQueryDispatcher from "../../core/CallbackQueryDispatcher";

@AmqpHandler.Handler(QUEUES.TELEGRAM_EVENTS_QUEUE, 10)
@Reflect.metadata("amqp-handler-type", "telegram-events-handler")
export default class TelegramEventsHandler extends CallbackQueryDispatcher {
    protected async handle(event: Enqueuer.TelegramEvent, message: AMQPMessage): Promise<void | boolean> {
        switch (event.type) {
            case "left_chat_member":
                return this.handleLeftChatMember(event.message);
            case "new_chat_members":
                return this.handleNewChatMember(event.message);
            case "callback_query":
                return this.handleCallbackQuery(event.message as unknown as CallbackQuery);
            default:
                throw new AMQPNack("Unknown event type.", message.properties.messageId);
        }
    }

    protected async handleLeftChatMember(message: Message): Promise<void | boolean> {
        if (message.left_chat_member?.id) {
            const telegramId: number = message.left_chat_member.id;
            const me: User = await Bot.getCurrent().getMe();
            if (telegramId == me.id) {
                await Chat.delete({chatId: message.chat.id});
            } else {
                await Collaborator.delete({telegramId});
            }
        }
    }

    protected async handleNewChatMember(message: Message): Promise<void | boolean> {
        for (const newChatMember of message.new_chat_members || []) {
            const telegramId: number = newChatMember.id;
            const me: User = await Bot.getCurrent().getMe();
            if (telegramId == me.id) {
                const chat: Chat = new Chat();
                chat.chatId = message.chat.id;
                await chat.save();
            }
        }
    }
}
