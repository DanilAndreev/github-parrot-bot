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

import * as TelegramBot from "node-telegram-bot-api";
import {CallbackQuery} from "node-telegram-bot-api";
import {Logger} from "../logger/Logger";
import Config from "../../interfaces/Config";
import SystemConfig from "../SystemConfig";
import ChatCommandEvent from "../../events/telegram/ChatCommandEvent";
import TelegramEventEvent from "../../events/telegram/TelegramEventEvent";
import BotCommand from "./BotCommand";
import Metricable from "../interfaces/Metricable";

/**
 * Bot - class for telegram bot api.
 * @class
 * @author Danil Andreev
 */
class Bot extends TelegramBot implements Metricable {
    /**
     * current - current class instance. Singleton.
     */
    protected static current: Bot;

    /**
     * metricsPrev - quantity of commands for last 5 seconds.
     */
    private metricsPrev: number;

    /**
     * metricsActive - quantity of commands live encounter. Not shown;
     */
    private metricsActive: number;

    /**
     * metricsInterval - Interval for calculating metrics.
     */
    public readonly metricsInterval: NodeJS.Timeout;

    /**
     * Creates an instance of Bot.
     * @param token - Telegram bot token.
     * @param polling - Updates getting method.
     * @protected
     */
    protected constructor(token?: string, polling: boolean = false) {
        if (!token) throw new Error(`FatalError: you must specify token to run this app! "token" = "${token}".`);
        Logger.info(`Creating telegram bot. Polling: ${polling}. Tag: ${SystemConfig.getConfig<Config>().bot.tag}`);
        super(token, {polling});

        this.metricsActive = 0;
        this.metricsPrev = 0;
        this.metricsInterval = setInterval(() => {
            this.metricsPrev = this.metricsActive;
            this.metricsActive = 0;
        }, SystemConfig.getConfig<Config>().system.metricsUpdateInterval);

        this.addListener("left_chat_member", this.handleMemberLeftChat);
        this.addListener("polling_error", (error: Error) => Logger.error("Polling error:", error));
        this.addListener("callback_query", this.handleCallbackQuery);
        Logger.silly(`Added listener of "left_chat_member" for bot.`);
        this.addListener("new_chat_members", this.handleNewChatMember);
        Logger.silly(`Added listener of "new_chat_members" for bot.`);
        let regExp: RegExp = /^\/([^\s@]+)(?:\s)?(.*)?/;
        if (SystemConfig.getConfig<Config>().bot.tag)
            regExp = new RegExp(`^/([^\\s@]+)(?:${SystemConfig.getConfig<Config>().bot.tag})?(?:\\s)?(.*)?`);
        this.onText(regExp, (message, match) => {
            this.metricsActive++;
            Logger.debug(`Got command from chat id: ${message.chat.id}. Command: "${match && match[0]}"`);
            new ChatCommandEvent(message, match).enqueue().catch(Logger?.error);
        });
        Logger.silly(`Added listener for telegram messages.`);
        if (polling)
            this.updateBotCommandsHelp().catch((error: Error) => {
                Logger.error("Failed to update bot commands: " + error);
            });
    }

    /**
     * handleCallbackQuery - handler for inline keyboard callback query.
     * @method
     * @param message - CallbackQuery object.
     * @author Danil Andreev
     */
    protected async handleCallbackQuery(query: CallbackQuery): Promise<void> {
        this.metricsActive++;
        Logger.debug(`Caught event "left_chat_member" on chat id ${query.message?.chat.id}: "${query.data}"`);
        await new TelegramEventEvent("callback_query", query).setExpiration(100 * 60 * 2).enqueue();
    }

    /**
     * updateBotCommandsHelp - updates telegram bot help for commands.
     * @method
     * @author Danil Andreev
     */
    protected async updateBotCommandsHelp(): Promise<boolean> {
        return await this.setMyCommands(
            SystemConfig.getConfig<Config>().bot.commands
                .filter((command: typeof BotCommand) => !!Reflect.getMetadata("bot-command-name", command))
                .map((command: typeof BotCommand) => {
                    const name: string = Reflect.getMetadata("bot-command-name", command);
                    const args: string = Reflect.getMetadata("bot-command-arguments", command);
                    const description: string = Reflect.getMetadata("bot-command-description", command);
                    return {
                        command: name,
                        description: [args, description].filter(i => i).join(" "),
                    };
                })
        );
        return true;
    }

    /**
     * handleMemberLeftChat - handler for chat member leave.
     * @method
     * @param message - Message object.
     * @author Danil Andreev
     */
    protected async handleMemberLeftChat(message: TelegramBot.Message): Promise<void> {
        this.metricsActive++;
        Logger.debug(
            `Caught event "left_chat_member" on chat id ${message.chat.id}. Member id: ${message.left_chat_member?.id}`
        );
        await new TelegramEventEvent("left_chat_member", message).enqueue();
    }

    /**
     * handleMemberLeftChat - handler for new chat member.
     * @method
     * @param message - Message object.
     * @author Danil Andreev
     */
    protected async handleNewChatMember(message: TelegramBot.Message): Promise<void> {
        this.metricsActive++;
        Logger.debug(
            `Caught event "new_chat_members" on chat id ${message.chat.id}. Member ids: ${message.new_chat_members?.map(
                member => member.id
            )}.`
        );
        await new TelegramEventEvent("new_chat_members", message).enqueue();
    }

    /**
     * init - initializes an instance of Bot and stores it in current.
     * @param token - Telegram bot token.
     * @param polling - Updates getting method.
     */
    public static init(token?: string, polling?: boolean): Bot {
        Logger.silly(`Bot initialization...`);
        if (this.current) throw new ReferenceError("Class instance is already created.");
        this.current = new Bot(token, polling);
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

    /**
     * getMetrics - returns quantity of handled commands from the telegram.
     * @method
     * @author Danil Andreev
     */
    public getMetrics(): number {
        return this.metricsPrev;
    }

    public release(): void {
        clearInterval(this.metricsInterval);
    }
}

export default Bot;
