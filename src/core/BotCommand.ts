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

import {Message} from "node-telegram-bot-api";
import Bot from "./Bot";
import CommandError from "../errors/CommandError";
import * as commander from "commander";
import {Command, CommanderError, Option} from "commander";
import stringArgv from "string-argv";
import JSONObject from "../interfaces/JSONObject";


/**
 * BotCommand - basic class for creating Telegram bot commands.
 * You should override handler method and use it as entry point for your command handler.
 * @class
 * @author Danil Andreev
 */
@Reflect.metadata("bot-command", true)
@Reflect.metadata("bot-command-allowed-unknown-option", false)
@Reflect.metadata("bot-command-allowed-excess-arguments", false)
abstract class BotCommand {
    /**
     * validation - validation spec array.
     */
    public validation: commander.Command;
    /**
     * pattern - command pattern.
     * For example - "myCommand".
     */
    public pattern: string;

    /**
     * Creates an instance of BotCommand.
     * @constructor
     * @author Danil Andreev
     */
    public constructor() {
        this.validation = new Command();
        this.validation
            .exitOverride((error: CommanderError) => {
                throw error;
            })
            .helpOption(false)
            .allowUnknownOption(false)
            .allowExcessArguments(false);
        this.pattern = "";
    }

    /**
     * handler - command handler. Here you can do actions.
     * @method
     * @abstract
     * @author Danil Andreev
     * @param message - Chat message.
     * @param args - Command arguments list.
     * @param options - Json with command options.
     */
    protected abstract async handler(message: Message, args: string[], options: JSONObject<string>): Promise<void | string | string[]>;

    /**
     * execute - method for command execution. Contain error handlers and validation process.
     * @author Danil Andreev
     * @param message - Chat message object.
     * @param match - RegExp match object.
     */
    public async execute(message: Message, match: RegExpExecArray) {
        this.validation.action(async (...params) => {
            try {
                const command: Command = params[params.length - 1];
                let result: string | string[] | void = await this.handler(message, command.args, command.opts());
                if (Array.isArray(result)) result = result.join("\n");
                if (result) {
                    await Bot.getCurrent().sendMessage(message.chat.id, result, {parse_mode: "HTML"});
                }
            } catch (error) {
                if (error instanceof CommandError) {
                    const out_message = error.message;
                    Bot
                        .getCurrent()
                        .sendMessage(message.chat.id, "<i>Error:</i> \n" + out_message, {parse_mode: "HTML"})
                        .catch(err => {
                            throw err;
                        });
                } else {
                    await Bot.getCurrent().sendMessage(message.chat.id, "Unrecognized error");
                    console.error(error);
                }
            }
        });

        try {
            const argv = stringArgv(match[1] || "");
            this.validation.parse(argv, {from: "user"});
        } catch (error) {
            if (error instanceof CommanderError) {
                await Bot
                    .getCurrent()
                    .sendMessage(message.chat.id, error.message + "\n\n" + this.validation.helpInformation());
            } else {
                await Bot.getCurrent().sendMessage(message.chat.id, "Unrecognized error");
                console.error(error);
            }
        }
    }

    /**
     * getCallback - prepares and returns callback for telegram api.
     * @method
     * @author Danil Andreev
     */
    public getCallback(): BotCommand.CallbackFunction {
        return async (message: Message, match: RegExpExecArray): Promise<void> => this.execute(message, match);
    }

    /**
     * getCommandRegExp - returns command pattern.
     * @method
     * @author Danil Andreev
     */
    public getCommandPattern(): string {
        return this.pattern;
    }
}

namespace BotCommand {
    /**
     * Command - decorator for bot command.
     * @param name - command name.
     * @param args_pattern - command arguments pattern.
     */
    export function Command(name: string, args_pattern: string = "") {
        return function BotCommandWrapper<T extends new(...args: any[]) => {}>(objectConstructor: T): T {
            return class WrappedBotCommand extends objectConstructor {
                constructor(...args: any[]) {
                    super(...args);
                    if (this instanceof BotCommand) {
                        Reflect.defineMetadata("bot-command-name", name, WrappedBotCommand.prototype);
                        Reflect.defineMetadata("bot-command-arguments", args_pattern, WrappedBotCommand.prototype);
                        this.validation.arguments([name, args_pattern].join(" "));
                        this.validation.name(name);
                        this.pattern = name;
                    } else {
                        throw new TypeError(`Invalid decorated class, expected BotCommand or derived from it.`);
                    }
                }
            };
        };
    }

    /**
     * Option - decorator for adding bot command options.
     * @author Danil Andreev
     * @param flags - Flags spec of commander.Option object.
     * @param description - Flag description.
     * @param defaultValue - Default flag value.
     */
    export function Option(flags: string | Option, description?: string, defaultValue?: string | boolean) {
        return function BotCommandWrapper<T extends new(...args: any[]) => {}>(objectConstructor: T): T {
            return class WrappedBotCommand extends objectConstructor {
                constructor(...args: any[]) {
                    super(...args);
                    if (this instanceof BotCommand) {
                        if (flags instanceof Option) {
                            this.validation.addOption(flags as Option);
                        } else {
                            this.validation.option(flags as string, description, defaultValue);
                        }
                    } else {
                        throw new TypeError(`Invalid decorated class, expected BotCommand or derived from it.`);
                    }
                }
            };
        };
    }

    /**
     * Description - decorator for adding bot command description.
     * @author Danil Andreev
     * @param str - Description string.
     * @param argsDescription - Object with arguments descriptions. Key - argument name.
     */
    export function Description(str: string, argsDescription?: { [p: string]: string } | undefined) {
        return function BotCommandWrapper<T extends new(...args: any[]) => {}>(objectConstructor: T): T {
            return class WrappedBotCommand extends objectConstructor {
                constructor(...args: any[]) {
                    super(...args);
                    if (this instanceof BotCommand) {
                        Reflect.defineMetadata("bot-command-description", str, WrappedBotCommand.prototype);
                        Reflect.defineMetadata("bot-command-arguments-description", argsDescription, WrappedBotCommand.prototype);
                        this.validation.description(str, argsDescription);
                    } else {
                        throw new TypeError(`Invalid decorated class, expected BotCommand or derived from it.`);
                    }
                }
            };
        };
    }

    /**
     * AllowExcessArguments - decorator for allowing command excess arguments.
     * @author Danil Andreev
     */
    export function AllowExcessArguments() {
        return function BotCommandWrapper<T extends new(...args: any[]) => {}>(objectConstructor: T): T {
            return class WrappedBotCommand extends objectConstructor {
                constructor(...args: any[]) {
                    super(...args);
                    if (this instanceof BotCommand) {
                        Reflect.defineMetadata("bot-command-allowed-excess-arguments", true, WrappedBotCommand.prototype);
                        this.validation.allowExcessArguments(true);
                    } else {
                        throw new TypeError(`Invalid decorated class, expected BotCommand or derived from it.`);
                    }
                }
            };
        };
    }

    /**
     * AllowUnknownOptions - decorator for allowing command unknown options.
     * @author Danil Andreev
     */
    export function AllowUnknownOptions() {
        return function BotCommandWrapper<T extends new(...args: any[]) => {}>(objectConstructor: T): T {
            return class WrappedBotCommand extends objectConstructor {
                constructor(...args: any[]) {
                    super(...args);
                    if (this instanceof BotCommand) {
                        Reflect.defineMetadata("bot-command-allowed-unknown-option", true, WrappedBotCommand.prototype);
                        this.validation.allowUnknownOption(true);
                    } else {
                        throw new TypeError(`Invalid decorated class, expected BotCommand or derived from it.`);
                    }
                }
            };
        };
    }

    /**
     * AllowUnknownOptions - decorator for allowing command unknown options.
     * @author Danil Andreev
     * @param position - Help text position in summary help.
     * @param text - Help text.
     */
    export function HelpText(position: commander.AddHelpTextPosition, text: string) {
        return function BotCommandWrapper<T extends new(...args: any[]) => {}>(objectConstructor: T): T {
            return class WrappedBotCommand extends objectConstructor {
                constructor(...args: any[]) {
                    super(...args);
                    if (this instanceof BotCommand) {
                        Reflect.defineMetadata("bot-command-help-text", text, WrappedBotCommand.prototype);
                        this.validation.addHelpText(position, text);
                    } else {
                        throw new TypeError(`Invalid decorated class, expected BotCommand or derived from it.`);
                    }
                }
            };
        };
    }

    export type CallbackFunction = (message: Message, match: RegExpExecArray) => Promise<void>
}

export default BotCommand;
