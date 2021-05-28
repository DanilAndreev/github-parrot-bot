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
import CommandError from "../../errors/CommandError";
import * as commander from "commander";
import {Command as CommanderCommand, CommanderError, Option as CommanderOption} from "commander";
import stringArgv from "string-argv";
import JSONObject from "../interfaces/JSONObject";
import {Logger} from "../logger/Logger";
import SendChatMessageEvent from "../../events/telegram/SendChatMessageEvent";

/**
 * BotCommand - basic class for creating Telegram bot commands.
 * You should override handler method and use it as entry point for your command handler.
 * @class
 * @author Danil Andreev
 */
@Reflect.metadata("bot-command", true)
@Reflect.metadata("bot-command-allowed-unknown-option", false)
@Reflect.metadata("bot-command-allowed-excess-arguments", false)
class BotCommand {
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
        this.pattern = "";
    }

    protected createValidator(): commander.Command {
        const validator = new CommanderCommand();
        validator
            .exitOverride((error: CommanderError) => {
                throw error;
            })
            .helpOption(false)
            .allowUnknownOption(!!Reflect.getMetadata("bot-command", this, "allow-unknown-options-enabled"))
            .allowExcessArguments(!!Reflect.getMetadata("bot-command", this, "allow-excess-arguments-enabled"));


        const name: string | undefined = Reflect.getMetadata("bot-command", this, "name");
        if (!name)
            throw new TypeError("Invalid command. You should specify the command name via Command decorator.");
        const args: string = Reflect.getMetadata("bot-command", this, "arguments") || name;
        validator.name(name);
        validator.arguments(args);


        const options = Reflect.getMetadata("bot-command", this, "options") || [];
        for (const option of options) {
            validator.addOption(option);
        }

        const helpText: {position: commander.AddHelpTextPosition, text: string} | undefined = Reflect.getMetadata(
            "bot-command",
            this,
            "help-text"
        );
        if (helpText)
            validator.addHelpText(helpText.position, helpText.text);

        const description: string | undefined = Reflect.getMetadata(
            "bot-command",
            this,
            "description"
        );
        const argsDescription: JSONObject | undefined = Reflect.getMetadata(
            "bot-command",
            this,
            "arguments-description"
        );
        if (description)
            validator.description(description, argsDescription)

        return validator;
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
    protected async handler(
        message: Message,
        args: string[],
        options: JSONObject<string>
    ): Promise<void | string | string[]> {
        throw new ReferenceError(`Abstract method call. Inherit this class and override this method.`);
    }

    /**
     * execute - method for command execution. Contain error handlers and validation process.
     * @author Danil Andreev
     * @param message - Chat message object.
     * @param match - RegExp match object.
     */
    public async execute(message: Message, match: RegExpExecArray) {
        Logger?.debug(`Handling Telegram chat command "${match[0]}".`);
        const validator: commander.Command = this.createValidator();
        validator.action(async (...params) => {
            try {
                const command: CommanderCommand = params[params.length - 1];
                let result: string | string[] | void = await this.handler(message, command.args, command.opts());
                if (Array.isArray(result)) result = result.join("\n");
                if (result) {
                    await new SendChatMessageEvent(message.chat.id, result, {
                        parse_mode: "HTML",
                        reply_to_message_id: message.message_id,
                    }).enqueue();
                }
            } catch (error) {
                if (error instanceof CommandError) {
                    const out_message = error.message;
                    await new SendChatMessageEvent(message.chat.id, "<i>Error:</i> \n" + out_message, {
                        parse_mode: "HTML",
                        reply_to_message_id: message.message_id,
                    }).enqueue();
                } else {
                    await new SendChatMessageEvent(message.chat.id, "Unrecognized error", {
                        reply_to_message_id: message.message_id,
                    }).enqueue();
                }
            }
        });

        try {
            const argv = stringArgv(match[2] || "");
            validator.parse(argv, {from: "user"});
        } catch (error) {
            if (error instanceof CommanderError) {
                await new SendChatMessageEvent(
                    message.chat.id,
                    error.message + "\n\n" + validator.helpInformation()
                ).enqueue();
            } else {
                await new SendChatMessageEvent(message.chat.id, "Unrecognized error").enqueue();
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
     * @param argsPattern - command arguments pattern.
     */
    export function Command(name: string, argsPattern: string = "") {
        return function BotCommandWrapper<T extends new (...args: any[]) => {}>(objectConstructor: T): T {
            return class WrappedBotCommand extends objectConstructor {
                constructor(...args: any[]) {
                    super(...args);
                    if (this instanceof BotCommand) {
                        Reflect.defineMetadata("bot-command", name, WrappedBotCommand.prototype, "name");
                        Reflect.defineMetadata("bot-command", [name, argsPattern].join(" "), WrappedBotCommand.prototype, "arguments");
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
    export function Option(flags: string | CommanderOption, description?: string, defaultValue?: string | boolean) {
        return function BotCommandWrapper<T extends new (...args: any[]) => {}>(objectConstructor: T): T {
            return class WrappedBotCommand extends objectConstructor {
                constructor(...args: any[]) {
                    super(...args);
                    if (this instanceof BotCommand) {
                        if (!Reflect.getMetadata("bot-command", WrappedBotCommand.prototype, "options")) {
                            Reflect.defineMetadata("bot-command", [], WrappedBotCommand.prototype, "options");
                        }

                        const meta = Reflect.getMetadata("bot-command", WrappedBotCommand.prototype, "options");
                        if (flags instanceof CommanderOption) {
                            meta.push(flags);
                        } else if (typeof flags === "string") {
                            meta.push(new CommanderOption(flags, description));
                        }
                        Reflect.defineMetadata("bot-command", meta, WrappedBotCommand.prototype, "options")

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
        return function BotCommandWrapper<T extends new (...args: any[]) => {}>(objectConstructor: T): T {
            return class WrappedBotCommand extends objectConstructor {
                constructor(...args: any[]) {
                    super(...args);
                    if (this instanceof BotCommand) {
                        Reflect.defineMetadata("bot-command", str, WrappedBotCommand.prototype, "description");
                        Reflect.defineMetadata("bot-command", argsDescription, WrappedBotCommand.prototype, "arguments-description");
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
        return function BotCommandWrapper<T extends new (...args: any[]) => {}>(objectConstructor: T): T {
            return class WrappedBotCommand extends objectConstructor {
                constructor(...args: any[]) {
                    super(...args);
                    if (this instanceof BotCommand) {
                        Reflect.defineMetadata(
                            "bot-command",
                            true,
                            WrappedBotCommand.prototype,
                            "allow-excess-arguments-enabled"
                        );
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
        return function BotCommandWrapper<T extends new (...args: any[]) => {}>(objectConstructor: T): T {
            return class WrappedBotCommand extends objectConstructor {
                constructor(...args: any[]) {
                    super(...args);
                    if (this instanceof BotCommand) {
                        Reflect.defineMetadata(
                            "bot-command",
                            true,
                            WrappedBotCommand.prototype,
                            "allow-unknown-options-enabled"
                        );
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
        return function BotCommandWrapper<T extends new (...args: any[]) => {}>(objectConstructor: T): T {
            return class WrappedBotCommand extends objectConstructor {
                constructor(...args: any[]) {
                    super(...args);
                    if (this instanceof BotCommand) {
                        Reflect.defineMetadata(
                            "bot-command-help-text",
                            {position, text},
                            WrappedBotCommand.prototype,
                            "help-text"
                        );
                    } else {
                        throw new TypeError(`Invalid decorated class, expected BotCommand or derived from it.`);
                    }
                }
            };
        };
    }

    export type CallbackFunction = (message: Message, match: RegExpExecArray) => Promise<void>;
}

export default BotCommand;
