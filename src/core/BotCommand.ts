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
import {Bot} from "./Bot";
import ValidationError from "../errors/ValidationError";


/**
 * BotCommand - basic class for creating Telegram bot commands.
 * You should override handler method and use it as entry point for your command handler.
 * @class
 * @author Danil Andreev
 */
class BotCommand {
    /**
     * validation - validation spec array.
     */
    public validation = [];
    /**
     * pattern - command pattern.
     * For example - "myCommand".
     */
    public pattern: string = ""

    /**
     * handler - command handler. Here you can do actions.
     * @method
     * @abstract
     * @author Danil Andreev
     * @param message - Chat message.
     * @param args - Command arguments list.
     */
    protected async handler(message: Message, args: BotCommand.CommandArgument[]): Promise<void> {
        throw ReferenceError("sdf")
    }

    /**
     * validate - validates command arguments and call.
     * @method
     * @author Danil Andreev
     * @param match - RegExp matches array.
     */
    protected validate(match: string[]): BotCommand.CommandArgument[] {
        return []
    }

    /**
     * execute - method for executing bot command.
     * @method
     * @author Danil Andreev
     * @param message - Chat message.
     * @param match - Arguments RegExp match.
     */
    public async execute(message: Message, match: string[]): Promise<void> {
        try {
            const args: BotCommand.CommandArgument[] = this.validate(match);
            await this.handler(message, args);
        } catch (error) {
            if (error instanceof ReferenceError) {
                throw error;
            } else if (error instanceof ValidationError) {
                await Bot.sendMessage(message.chat.id, error.message);
            } else {
                await Bot.sendMessage(message.chat.id, "Unrecognized error: " + error.message);
            }
        }
    }

    /**
     * getCallback - prepares and returns callback for telegram api.
     * @method
     * @author Danil Andreev
     */
    public getCallback(): BotCommand.CallbackFunction {
        return async (message: Message, match: string[]): Promise<void> => this.execute(message, match);
    }

    /**
     * getCommandRegExp - returns command regexp pattern.
     * @method
     * @author Danil Andreev
     */
    public getCommandRegExp(): RegExp {
        return new RegExp(this.pattern + " (.+)");
    }
}

namespace BotCommand {
    /**
     * CommandArgument - interface for command argument item.
     * @interface
     * @author Danil Andreev
     */
    export interface CommandArgument {
        /**
         * name - argumant name.
         */
        name: string;
        /**
         * value - parsed argument value.
         */
        value: string;
        /**
         * type - argument type.
         */
        type: string;
    }

    /**
     * Prototype - decorator for bot command.
     * @param pattern - command pattern (command name).
     * @param validation - command arguments spec array.
     */
    export function Prototype(pattern: string, validation?: []) {
        return function BotCommandWrapper<T extends new(...args: any[]) => {}>(objectConstructor: T): T {
            return class WrappedBotCommand extends objectConstructor {
                constructor(...args: any[]) {
                    super(...args);
                    if (this instanceof BotCommand) {
                        this.pattern = pattern;
                        if (validation) {
                            // TODO: check correctness.
                            this.validation.concat(validation);
                        }
                    } else {
                        throw new TypeError(`Invalid decorated class, expected BotCommand or derived from it.`);
                    }
                }
            }
        }
    }

    /**
     * Argument - decorator for adding bot command arguments.
     * @param validation - command arguments spec.
     */
    export function Argument(validation?: [] | any) {
        return function BotCommandWrapper<T extends new(...args: any[]) => {}>(objectConstructor: T): T {
            return class WrappedBotCommand extends objectConstructor {
                constructor(...args: any[]) {
                    super(...args);
                    if (this instanceof BotCommand) {
                        if (Array.isArray(validation)) {
                            // TODO: check correctness.
                            this.validation.concat(validation);
                        } else {
                            this.validation.push(validation)
                        }
                    } else {
                        throw new TypeError(`Invalid decorated class, expected BotCommand or derived from it.`);
                    }
                }
            }
        }
    }

    export type CallbackFunction = (message: Message, match: string[]) => Promise<void>
}

export default BotCommand;
