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
import CommandError from "./CommandError";
import {Bot} from "./Bot";
import {CommandFinalMessageSync} from "../interfaces/CommandFinalMessage";

export type BotHandler = (msg: TelegramBot.Message, match: RegExpExecArray) => CommandFinalMessageSync | Promise<CommandFinalMessageSync>;

const makeCommand = (handler: BotHandler) => async (msg: TelegramBot.Message, match: RegExpExecArray): Promise<void> => {
    try {
        let result = await handler(msg, match);
        if (Array.isArray(result)) result = result.join("\n");
        if (result) await Bot.sendMessage(msg.chat.id, result, {parse_mode: "Markdown"});
    } catch (error) {
        if (error instanceof CommandError) {
            const message = error.message;
            Bot.sendMessage(msg.chat.id, "Error: \n" + message, {parse_mode: "Markdown"}).catch(error => {
                throw error;
            });
        } else {
            throw error;
        }
    }
}

export default makeCommand;
