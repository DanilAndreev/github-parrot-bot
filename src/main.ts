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
import Bot from "./core/bot/Bot";
import WebServer from "./core/WebServer";
import AmqpDispatcher from "./core/amqp/AmqpDispatcher";
import IssuesGarbageCollector from "./chrono/IssuesGarbageCollector";
import PullRequestsGarbageCollector from "./chrono/PullRequestsGarbageCollector";
import CheckSuitsGarbageCollector from "./chrono/CheckSuitsGarbageCollector";
import SystemConfig from "./core/SystemConfig";
import Config from "./interfaces/Config";
import {Logger} from "./core/logger/Logger";
import FatalError from "./errors/FatalError";

/**
 * requiredFor - function, designed to determine if some functional is required.
 * @function
 * @param args - Config system settings next functional required for.
 * @author Danil Andreev
 */
function requiredFor(...args: string[]): boolean {
    return args.some((key: string) => SystemConfig.getConfig<Config>().system[key]);
}

/**
 * main process function.
 * @function
 * @main
 * @author Danil Andreev
 */
export default async function main(): Promise<void> {
    try {
        if (
            requiredFor(
                "drawEventsHandlers",
                "commandsEventHandlers",
                "githubEventsHandlers",
                "cronDatabaseGarbageCollectors"
            )
        ) {
            await setupDbConnection();
        }
        if (requiredFor("cronDatabaseGarbageCollectors")) {
            await new IssuesGarbageCollector({interval: 1000 * 60 * 30}).start();
            await new PullRequestsGarbageCollector({interval: 1000 * 60 * 30}).start();
            await new CheckSuitsGarbageCollector({interval: 1000 * 60 * 30}).start();
        }

        let server: WebServer | undefined;
        if (requiredFor("webserver")) {
            server = new WebServer();
        }
        if (requiredFor("drawEventsHandlers", "commandsProxy")) {
            const bot: Bot = Bot.init(
                SystemConfig.getConfig<Config>().bot.token,
                SystemConfig.getConfig<Config>().system.commandsProxy
            );
        }

        if (
            requiredFor("commandsProxy", "webserver", "githubEventsHandlers", "commandsEventHandlers", "drawEventsHandlers")
        ) {
            const RabbitMQ: AmqpDispatcher = await AmqpDispatcher.init();
        }

        server && server.start();
    } catch (error) {
        if (error instanceof FatalError) {
            throw error;
        }
        Logger?.error("Unhandled non fatal error in main thread: ", error);
    }
}
