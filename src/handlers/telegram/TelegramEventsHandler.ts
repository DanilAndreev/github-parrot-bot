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

import AmqpHandler from "../../core/amqp/AmqpHandler";
import {QUEUES} from "../../Globals";
import {Message as AMQPMessage} from "amqplib";
import {CallbackQuery, Message, User} from "node-telegram-bot-api";
import Chat from "../../entities/Chat";
import Collaborator from "../../entities/Collaborator";
import Bot from "../../core/bot/Bot";
import AMQPNack from "../../core/errors/AMQPNack";
import CallbackQueryDispatcher from "../../core/amqp/CallbackQueryDispatcher";
import TelegramEventEvent from "../../core/events/telegram/TelegramEventEvent";
import AMQPAck from "../../core/errors/AMQPAck";
import {Logger} from "../../core/logger/Logger";

@AmqpHandler.Handler(QUEUES.TELEGRAM_EVENTS_QUEUE, 10)
@Reflect.metadata("amqp-handler-type", "telegram-events-handler")
export default class TelegramEventsHandler extends CallbackQueryDispatcher {
    protected async handle(
        event: TelegramEventEvent.Serialized<Message | CallbackQuery>,
        message: AMQPMessage
    ): Promise<void | boolean> {
        switch (event.event) {
            case "left_chat_member":
                return this.handleLeftChatMember(event.message as Message);
            case "new_chat_members":
                return this.handleNewChatMember(event.message as Message);
            case "callback_query":
                return this.handleCallbackQuery(event.message as CallbackQuery);
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
                try {
                    await chat.save();
                } catch (error) {
                    Logger.warn(`Chat "${message.chat.username}"(${message.chat.id}) already exists in database.`);
                    throw new AMQPAck(`Chat "${message.chat.username}"(${message.chat.id}) already exists.`);
                }
            }
        }
    }
}
