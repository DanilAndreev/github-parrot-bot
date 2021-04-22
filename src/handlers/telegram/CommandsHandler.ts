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
import {Message} from "node-telegram-bot-api";
import {QUEUES} from "../../globals";
import BotCommand from "../../core/BotCommand";
import config from "../../config";
import SendChatMessageEvent from "../../events/telegram/SendChatMessageEvent";

@AmqpHandler.Handler(QUEUES.TELEGRAM_CHAT_COMMAND, 10)
@Reflect.metadata("amqp-handler-type", "commands-event-handler")
class CommandsHandler extends AmqpHandler {
    protected commands: BotCommand[] = [];

    public constructor() {
        super();
        this.commands = config.bot.commands.map((CommandClass: typeof BotCommand) => new CommandClass());
    }

    protected async handle(content: CommandsHandler.CommandMessage): Promise<void | boolean> {
        const {message, match} = content;
        let flag: boolean = false;
        for (const command of this.commands) {
            if (command.getCommandPattern() == match[1]) {
                await command.execute(message, match);
                flag = true;
            }
        }
        if (!flag) {
            await new SendChatMessageEvent(message.chat.id, "Invalid command.", {
                reply_to_message_id: message.message_id,
            }).enqueue();
        }
    }
}

namespace CommandsHandler {
    export interface CommandMessage {
        message: Message;
        match: RegExpExecArray;
    }
}

export default CommandsHandler;
