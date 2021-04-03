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
import Enqueuer from "./Enqueuer";

/**
 * Bot - class for telegram bot api.
 * @class
 * @author Danil Andreev
 */
export default class Bot extends TelegramBot {
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
        if (!token) throw new Error(`FatalError: you must specify token to run this app! "token" = "${token}".`);
        console.log("Creating telegram bot.");
        super(token, {polling: true});
        this.addListener("left_chat_member", this.handleMemberLeftChat);
        this.addListener("new_chat_members", this.handleNewChatMember);
        this.onText(/^\/([^\s@]+)(?:@GitHubIssuesPullsTrackingBot)?(?:\s)?(.*)?/, (message, match) =>
            Enqueuer.chatCommand(message, match)
        );
        // this.updateBotCommandsHelp().catch((error: Error) => {
        //     console.error("Failed to update bot commands: ", error);
        // });
    }

    /**
     * updateBotCommandsHelp - updates telegram bot help for commands.
     * @method
     * @author Danil Andreev
     */
    protected async updateBotCommandsHelp(): Promise<boolean> {
        // return await this.setMyCommands(
        //     Bot.commands
        //         .filter((command: BotCommand) => !!Reflect.getMetadata("bot-command-name", command))
        //         .map((command: BotCommand) => {
        //             const name: string = Reflect.getMetadata("bot-command-name", command);
        //             const args: string = Reflect.getMetadata("bot-command-arguments", command);
        //             const description: string = Reflect.getMetadata("bot-command-description", command);
        //             return {
        //                 command: name,
        //                 description: [args, description].filter(i => i).join(" "),
        //             };
        //         })
        // );
        return true;
    }

    /**
     * handleMemberLeftChat - handler for chat member leave.
     * @method
     * @param message - Message object.
     * @author Danil Andreev
     */
    protected async handleMemberLeftChat(message: TelegramBot.Message): Promise<void> {
        await Enqueuer.telegramEvent("left_chat_member", message);
    }

    /**
     * handleMemberLeftChat - handler for new chat member.
     * @method
     * @param message - Message object.
     * @author Danil Andreev
     */
    protected async handleNewChatMember(message: TelegramBot.Message): Promise<void> {
        await Enqueuer.telegramEvent("new_chat_members", message);
    }

    /**
     * init - initializes an instance of Bot and stores it in current.
     * @param token - Telegram bot token.
     */
    public static init(token?: string): Bot {
        if (this.current) throw new ReferenceError("Class instance is already created.");
        this.current = new Bot(token);
        return this.current;
    }

    /**
     * getCurrent - returns current instance of Bot.
     * If bot hasn't been initialized - it will be initialized automatically.
     */
    public static getCurrent(): Bot {
        if (!this.current) this.init();
        return this.current;
    }
}
