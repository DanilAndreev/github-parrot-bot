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
import ValidationError from "../errors/ValidationError";
import Validator from "./Validator";
import CommandError from "./CommandError";


/**
 * BotCommand - basic class for creating Telegram bot commands.
 * You should override handler method and use it as entry point for your command handler.
 * @class
 * @author Danil Andreev
 */
abstract class BotCommand {
    /**
     * validation - validation spec array.
     */
    public validation: Validator<any>[] = [];
    /**
     * pattern - command pattern.
     * For example - "myCommand".
     */
    public pattern: string = "";

    /**
     * handler - command handler. Here you can do actions.
     * @method
     * @abstract
     * @author Danil Andreev
     * @param message - Chat message.
     * @param args - Command arguments list.
     */
    protected abstract async handler(message: Message, args: BotCommand.CommandArguments): Promise<void | string | string[]>;

    /**
     * validate - validates command arguments and call.
     * @method
     * @author Danil Andreev
     * @param words - RegExp matches array.
     */
    protected validate(words: string[]): BotCommand.CommandArguments {
        if (words.length > this.validation.length) {
            throw new ValidationError("Too many arguments passed.");
        }
        const args: BotCommand.CommandArguments = {};
        try {
            for (let i = 0; i < this.validation.length; i++) {
                const validator: Validator<any> = this.validation[i];
                const value = words[i];
                if (validator.required && value === undefined)
                    throw new ValidationError(`Required argument "${validator.key}" can not be empty.`);
                validator.validate(value);
                args[validator.key] = value;
            }
        } catch (error) {
            if (error instanceof ValidationError) {
                throw error;
            }
            console.log(error);
            //TODO: handle
        }

        return args;
    }

    /**
     * execute - method for executing bot command.
     * @method
     * @author Danil Andreev
     * @param message - Chat message.
     * @param match - Arguments RegExp match.
     */
    public async execute(message: Message, match: RegExpExecArray): Promise<void> {
        try {
            const args: BotCommand.CommandArguments = this.validate((match[1] || "").split(" "));
            let result: string | string[] | void = await this.handler(message, args);
            if (Array.isArray(result)) result = result.join("\n");
            if (result) {
                await Bot.getCurrent().sendMessage(message.chat.id, result, {parse_mode: "HTML"});
            }
        } catch (error) {
            if (error instanceof ReferenceError) {
                throw error;
            } else if (error instanceof ValidationError) {
                await Bot.getCurrent().sendMessage(message.chat.id, error.message);
            } else if (error instanceof CommandError) {
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
     * CommandArgument - interface for command argument item.
     * @interface
     * @author Danil Andreev
     */
    export interface CommandArguments {
        [key: string]: string | number | undefined;
    }

    /**
     * Command - decorator for bot command.
     * @param pattern - command pattern (command name).
     * @param validation
     */
    export function Command(pattern: string, validation?: Validator<any>[]) {
        return function BotCommandWrapper<T extends new(...args: any[]) => {}>(objectConstructor: T): T {
            return class WrappedBotCommand extends objectConstructor {
                constructor(...args: any[]) {
                    super(...args);
                    if (this instanceof BotCommand) {
                        this.pattern = pattern;
                        if (validation) {
                            for (const validator of validation) {
                                if (this.validation.find(candidate => candidate.key == validator.key))
                                    throw new ReferenceError(`Duplicate argument key "${validator.key}" on command "${this.pattern}".`);
                                this.validation.push(validator);
                            }
                        }
                        // Bot.commands.push(this);
                    } else {
                        throw new TypeError(`Invalid decorated class, expected BotCommand or derived from it.`);
                    }
                }
            };
        };
    }

    /**
     * Argument - decorator for adding bot command arguments.
     * @param validation -
     */
    export function Argument(validation: Validator<any> | Validator<any>[]) {
        return function BotCommandWrapper<T extends new(...args: any[]) => {}>(objectConstructor: T): T {
            return class WrappedBotCommand extends objectConstructor {
                constructor(...args: any[]) {
                    super(...args);
                    if (this instanceof BotCommand) {
                        if (Array.isArray(validation)) {
                            for (const validator of validation) {
                                if (this.validation.find(candidate => candidate.key == validator.key))
                                    throw new ReferenceError(`Duplicate argument key "${validator.key}" on command "${this.pattern}".`);
                                this.validation.push(validator);
                            }
                        } else if (validation) {
                            if (this.validation.find(candidate => candidate.key == validation.key))
                                throw new ReferenceError(`Duplicate argument key "${validation.key}" on command "${this.pattern}".`);
                            this.validation.push(validation);
                        }
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
