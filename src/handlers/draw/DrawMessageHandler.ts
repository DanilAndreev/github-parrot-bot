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
import {QUEUES} from "../../globals";
import AmqpHandler from "../../core/AmqpHandler";
import Bot from "../../core/Bot";
import etelegramIgnore from "../../utils/etelegramIgnore";
import AMQPAck from "../../errors/AMQPAck";
import AMQPNack from "../../errors/AMQPNack";
import {Message as AMQPMessage} from "amqplib";
import SendChatMessageEvent from "../../events/telegram/SendChatMessageEvent";
import AmqpEvent from "../../core/AmqpEvent";
import EditChatMessageTextEvent from "../../events/telegram/EditChatMessageTextEvent";
import EditChatMessageReplyMarkupEvent from "../../events/telegram/EditChatMessageReplyMarkupEvent";
import EditChatMessageLiveLocationEvent from "../../events/telegram/EditChatMessageLiveLocationEvent";
import DeleteChatMessageEvent from "../../events/telegram/DeleteChatMessageEvent";

@WebHookAmqpHandler.Handler(QUEUES.DRAW_TELEGRAM_MESSAGE_QUEUE, 10)
@Reflect.metadata("amqp-handler-type", "draw-event-handler")
class DrawMessageHandler extends AmqpHandler {
    protected async handle(event: AmqpEvent.Serialized, message: AMQPMessage): Promise<void | boolean> {
        switch (event.type) {
            case "send-chat-message":
                return await this.sendChatMessage(event as SendChatMessageEvent.Serialized, message);
            case "edit-message-text":
                return await this.editMessageText(event as EditChatMessageTextEvent.Serialized, message);
            case "edit-message-reply-markup":
                return await this.editMessageReplyMarkup(event as EditChatMessageReplyMarkupEvent.Serialized, message);
            case "edit-message-live-location":
                return await this.editMessageLiveLocation(event as EditChatMessageLiveLocationEvent.Serialized, message);
            case "delete-chat-message":
                return await this.deleteMessage(event as DeleteChatMessageEvent.Serialized, message);
            default:
                throw new AMQPAck(`Incorrect message type. Got: "${event.type}"`, message.properties.messageId);
        }
    }

    protected async sendChatMessage(
        event: SendChatMessageEvent.Serialized,
        message: AMQPMessage
    ): Promise<void | boolean> {
        try {
            await Bot.getCurrent().sendMessage(event.chatId, event.text, event.options);
        } catch {
            try {
                await Bot.getCurrent().sendMessage(event.chatId, event.text, {
                    ...event.options,
                    reply_to_message_id: undefined
                });
            } catch (error) {
                throw new AMQPNack(`Failed to send message to chat ${event.chatId}.`, message.properties.messageId);
            }
        }
    }

    protected async editMessageText(
        event: Enqueuer.EditMessageTextEvent,
        message: AMQPMessage
    ): Promise<void | boolean> {
        try {
            await Bot.getCurrent().editMessageText(event.text, event.options);
        } catch (error) {
            if (!etelegramIgnore(error)) {
                try {
                    if (event.options?.chat_id)
                        await Bot.getCurrent().sendMessage(event.options.chat_id, event.text, event.options);
                } catch (err) {
                    throw new AMQPNack(
                        `Failed to edit telegram message ${event.options?.message_id}`,
                        message.properties.messageId
                    );
                }
            }
        }
    }

    protected async editMessageReplyMarkup(
        event: Enqueuer.EditMessageReplyMarkupEvent,
        message: AMQPMessage
    ): Promise<void | boolean> {
        try {
            await Bot.getCurrent().editMessageReplyMarkup(event.replyMarkup, event.options);
        } catch (error) {
            if (!etelegramIgnore(error))
                throw new AMQPNack(
                    `Failed to edit message ${event.options?.message_id} reply markup.`,
                    message.properties.messageId
                );
        }
    }

    protected async editMessageLiveLocation(
        event: Enqueuer.EditMessageLiveLocationEvent,
        message: AMQPMessage
    ): Promise<void | boolean> {
        try {
            await Bot.getCurrent().editMessageLiveLocation(event.latitude, event.latitude, event.options);
        } catch (error) {
            if (!etelegramIgnore(error))
                throw new AMQPNack(
                    `Failed to edit message ${event.options?.message_id} live location`,
                    message.properties.messageId
                );
        }
    }

    protected async deleteMessage(
        event: Enqueuer.DeleteChatMessageEvent,
        message: AMQPMessage
    ): Promise<void | boolean> {
        try {
            await Bot.getCurrent().deleteMessage(event.chatId, event.messageId, event.options);
        } catch {
            if (event.showMessageOnError) {
                try {
                    await Bot.getCurrent().sendMessage(
                        event.chatId,
                        "Warning: You should give permissions to delete messages for GitHub Tracker bot."
                    );
                } catch (error) {
                    if (!etelegramIgnore(error))
                        throw new AMQPNack(
                            `Failed to send message to chat ${event.chatId}.`,
                            message.properties.messageId
                        );
                }
            }
        }
    }
}

export default DrawMessageHandler;
