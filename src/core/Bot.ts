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
import makeCommand from "./makeCommand";
import addRepository from "../commands/addRepository";
import removeRepository from "../commands/removeRepository";
import listRepositories from "../commands/listRepositories";
import removeAllRepositories from "../commands/removeAllRepositories";
import connectMe from "../commands/connectMe";
import disconnectMe from "../commands/disconnectMe";
import whoAmI from "../commands/whoAmI";
import disconnectMeAll from "../commands/disconnectMeAll";
import removeAKA from "../commands/removeAKA";
import clearAKA from "../commands/clearAKA";
import listAKA from "../commands/listAKA";

export let Bot: TelegramBot | null = null;

export default function CreateBot(): TelegramBot {
    const token = process.env.TELEGRAM_BOT_TOKEN;

    if (!token)
        throw new Error(`FatalError: you must specify token to run this app! "token" = "${token}".`);

    console.log("Creating telegram bot.")
    const Bot = new TelegramBot(token, {polling: true});

    Bot.onText(/\/add (.+)/, makeCommand(addRepository));
    Bot.onText(/\/remove (.+)/, makeCommand(removeRepository));
    Bot.onText(/^\/remove_all/, makeCommand(removeAllRepositories));
    Bot.onText(/\/list/, makeCommand(listRepositories));

    Bot.onText(/\/connect_me (.+)/, makeCommand(connectMe));
    Bot.onText(/\/disconnect_me (.+)/, makeCommand(disconnectMe));
    Bot.onText(/^\/disconnect_me$/, makeCommand(disconnectMeAll));
    Bot.onText(/\/whoami/, makeCommand(whoAmI));

    Bot.onText(/\/remove_aka (.+)/, makeCommand(removeAKA));
    Bot.onText(/^\/clear_aka/, makeCommand(clearAKA));
    Bot.onText(/^\/akas/, makeCommand(listAKA));

    return Bot;
}

export function initBot() {
    Bot = CreateBot();
}