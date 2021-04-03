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

import {setupDbConnection} from "./core/DataBase";
import Bot from "./core/Bot";
import WebServer from "./core/WebServer";
import AmqpDispatcher from "./core/AmqpDispatcher";
import IssuesGarbageCollector from "./chrono/IssuesGarbageCollector";
import PullRequestsGarbageCollector from "./chrono/PullRequestsGarbageCollector";
import CheckSuitsGarbageCollector from "./chrono/CheckSuitsGarbageCollector";

export default async function main() {
    await setupDbConnection();
    await new IssuesGarbageCollector({interval: 1000 * 60 * 30}).start();
    await new PullRequestsGarbageCollector({interval: 1000 * 60 * 30}).start();
    await new CheckSuitsGarbageCollector({interval: 1000 * 60 * 30}).start();

    const server = new WebServer();
    const bot: Bot = Bot.init(process.env.TELEGRAM_BOT_TOKEN);
    const RabbitMQ: AmqpDispatcher = await AmqpDispatcher.init();

    server.start();
}
