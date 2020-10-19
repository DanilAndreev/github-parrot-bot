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

    Bot.onText(/\/add (.+)/, async (message, match) => {
        const usage = [
            `Usage: /add [repository_full_name] [secret]`,
            `Example: /add DanilAndreev/test_repo webhook_secret_string`
        ].join("\n");

        console.log("message /add");

        const chatId = message.from.id;
        const [repository, secret] = match[1] && match[1].split(" ");

        if (!repository) {
            const response = [
                `Error: Missing required parameter repository_full_name!`,
                usage,
            ].join("\n");
            await Bot.sendMessage(chatId, response);
            return;
        }

        if (!secret) {
            const response = [
                `Error: Missing required parameter secret!`,
                usage,
            ].join("\n");
            await Bot.sendMessage(chatId, response);
            return;
        }

        const webhook = new WebHook();
        webhook.secret = secret;
        webhook.chatId = chatId;
        webhook.repository = repository;
        const result = await webhook.save();
        await Bot.sendMessage(chatId, `Successfully added repository ${result.repository}`);
    });

    return Bot;
}
