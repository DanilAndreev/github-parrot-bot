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
import WebHook from "../entities/WebHook";
import CommandError from "./CommandError";
import makeCommand from "./makeCommand";
import * as argon2 from "argon2";
import createSecretPreview from "./createSecretPreview";
import addRepository from "../commands/addRepository";
import removeRepository from "../commands/removeRepository";
import listRepositories from "../commands/listRepositories";
import removeAllRepositories from "../commands/removeAllRepositories";

export let Bot: TelegramBot | null = null;

export default function CreateBot(): TelegramBot {
    const token = process.env.TELEGRAM_BOT_TOKEN;

    if (!token)
        throw new Error(`FatalError: you must specify token to run this app! "token" = "${token}".`);

    console.log("Creating telegram bot.")
    const Bot = new TelegramBot(token, {polling: true});

    Bot.onText(/\/echo (.+)/, (message, match) => {
        const chatId = message.from.id;
        console.log(`Message from ${chatId}, test : "${match[1]}"`);
        let response = match[1];
        Bot.sendMessage(chatId, response).then();
    });

    Bot.onText(/\/add (.+)/, makeCommand(addRepository));
    Bot.onText(/\/remove (.+)/, makeCommand(removeRepository));
    Bot.onText(/\/remove_all/, makeCommand(removeAllRepositories));
    Bot.onText(/\/list/, makeCommand(listRepositories));
    return Bot;
}

export function initBot() {
    Bot = CreateBot();
}