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
import AddRepositoryCommand from "../commands/AddRepositoryCommand";
import RemoveRepositoryCommand from "../commands/RemoveRepositoryCommand";
import ListRepositoriesCommand from "../commands/ListRepositoriesCommand";
import AKAsCommand from "../commands/AKAsCommand";
import ClearAKACommand from "../commands/ClearAKACommand";
import ConnectMeCommand from "../commands/ConnectMeCommand";
import DisconnectMeCommand from "../commands/DisconnectMeCommand";
import RemoveAKACommand from "../commands/RemoveAKACommand";

/**
 * Bot - class for telegram bot api.
 * @class
 * @author Danil Andreev
 */
export default class Bot extends TelegramBot {
    /**
     * commands - commands array. Decorate your class derived from BotCommand with decorator BotCommand.Command();
     */
    public static commands: BotCommand[] = [
        new AddRepositoryCommand(),
        new AKAsCommand(),
        new ClearAKACommand(),
        new ConnectMeCommand(),
        new DisconnectMeCommand(),
        new ListRepositoriesCommand(),
        new RemoveAKACommand(),
        new RemoveRepositoryCommand(),
    ];
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
        if (!token)
            throw new Error(`FatalError: you must specify token to run this app! "token" = "${token}".`);
        console.log("Creating telegram bot.");
        super(token, {polling: true});
        if (Bot.commands.length) {
            for (const command of Bot.commands) {
                this.onText(new RegExp(`\/${command.getCommandPattern()} (.+)`), command.getCallback());
                this.onText(new RegExp(`^\/${command.getCommandPattern()}$`), command.getCallback());
                if (process.env.TELEGRAM_TAG) {
                    let telegramTag: string = process.env.TELEGRAM_TAG;
                    if (telegramTag[0] !== "@") {
                        telegramTag = "@" + telegramTag;
                    }
                    this.onText(new RegExp(`\/${command.getCommandPattern()}${telegramTag} (.+)`), command.getCallback());
                    this.onText(new RegExp(`^\/${command.getCommandPattern()}${telegramTag}$`), command.getCallback());
                }
            }
        } else {
            console.warn("No commands provided.");
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
