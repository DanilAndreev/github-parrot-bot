/*
 * Author: Danil Andreev | danssg08@gmail.com | https://github.com/DanilAndreev
 *
 * MIT License
 *
 * Copyright (c) 2020 Danil Andreev
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

import * as TelegramBot from "node-telegram-bot-api";
import config from "../config";
import BotCommand from "./BotCommand";
import Collaborator from "../entities/Collaborator";
import {User} from "node-telegram-bot-api";
import Chat from "../entities/Chat";


/**
 * Bot - class for telegram bot api.
 * @class
 * @author Danil Andreev
 */
export default class Bot extends TelegramBot {
    /**
     * commands - commands array. Decorate your class derived from BotCommand with decorator BotCommand.Command();
     */
    public static commands: BotCommand[] = [];
    /**
     * current - current class instance. Singleton.
     */
    protected static current: Bot;

    /**
     * Creates an instance of Bot.
     * @param token - Telegram bot token.
     * @protected
     */
    protected constructor(token?: string) {
        token = token || config.bot.token;
        Bot.commands = config.bot.commands
            .map((CommandClass: typeof BotCommand) => new CommandClass());

        if (!token)
            throw new Error(`FatalError: you must specify token to run this app! "token" = "${token}".`);
        console.log("Creating telegram bot.");
        super(token, {polling: false});
        this.addListener("left_chat_member", this.handleMemberLeftChat);
        this.addListener("new_chat_members", this.handleNewChatMember);
        this.updateBotCommandsHelp().catch((error: Error) => {
            console.error("Failed to update bot commands: ", error);
        });

        if (Bot.commands.length) {
            for (const command of Bot.commands) {
                this.onText(new RegExp(`/${command.getCommandPattern()} (.+)`), command.getCallback());
                this.onText(new RegExp(`^/${command.getCommandPattern()}$`), command.getCallback());
                if (process.env.TELEGRAM_TAG) {
                    let telegramTag: string = process.env.TELEGRAM_TAG;
                    if (telegramTag[0] !== "@") {
                        telegramTag = "@" + telegramTag;
                    }
                    this.onText(new RegExp(`/${command.getCommandPattern()}${telegramTag} (.+)`), command.getCallback());
                    this.onText(new RegExp(`^/${command.getCommandPattern()}${telegramTag}$`), command.getCallback());
                }
            }
        } else {
            console.warn("No commands provided.");
        }
    }

    /**
     * updateBotCommandsHelp - updates telegram bot help for commands.
     * @method
     * @author Danil Andreev
     */
    protected async updateBotCommandsHelp(): Promise<boolean> {
        return await this.setMyCommands(
            Bot.commands
                .filter((command: BotCommand) => !!Reflect.getMetadata("bot-command-name", command))
                .map((command: BotCommand) => {
                    const name: string = Reflect.getMetadata("bot-command-name", command);
                    const args: string = Reflect.getMetadata("bot-command-arguments", command);
                    const description: string = Reflect.getMetadata("bot-command-description", command);
                    return {
                        command: name,
                        description: [args, description].filter(i => i).join(" ")
                    };
                })
        );
    }

    /**
     * handleMemberLeftChat - handler for chat member leave.
     * @method
     * @param message - Message object.
     * @author Danil Andreev
     */
    protected async handleMemberLeftChat(message: TelegramBot.Message) {
        if (message.left_chat_member?.id) {
            const telegramId: number = message.left_chat_member.id;
            const me: User = await this.getMe();
            if (telegramId == me.id) {
                await Chat.delete({chatId: message.chat.id});
            } else {
                await Collaborator.delete({telegramId});
            }
        }
    }

    /**
     * handleMemberLeftChat - handler for new chat member.
     * @method
     * @param message - Message object.
     * @author Danil Andreev
     */
    protected async handleNewChatMember(message: TelegramBot.Message) {
        for (const newChatMember of message.new_chat_members || []) {
            const telegramId: number = newChatMember.id;
            const me: User = await this.getMe();
            if (telegramId == me.id) {
                const chat: Chat = new Chat();
                chat.chatId = message.chat.id;
                await chat.save();
            }
        }
    }

    /**
     * init - initializes an instance of Bot and stores it in current.
     * @param token - Telegram bot token.
     */
    public static init(token?: string): Bot {
        if (this.current)
            throw new ReferenceError("Class instance is already created.");
        this.current = new Bot(token);
        return this.current;
    }

    /**
     * getCurrent - returns current instance of Bot.
     * If bot hasn't been initialized - it will be initialized automatically.
     */
    public static getCurrent(): Bot {
        if (!this.current)
            this.init();
        return this.current;
    }
}
