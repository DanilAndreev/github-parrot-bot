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
import WebServer from "./core/webserver/WebServer";
import AmqpDispatcher from "./core/amqp/AmqpDispatcher";
import IssuesGarbageCollector from "./chrono/IssuesGarbageCollector";
import PullRequestsGarbageCollector from "./chrono/PullRequestsGarbageCollector";
import CheckSuitsGarbageCollector from "./chrono/CheckSuitsGarbageCollector";
import SystemConfig from "./core/SystemConfig";
import Config from "./interfaces/Config";
import {Logger} from "./core/logger/Logger";
import FatalError from "./core/errors/FatalError";
import Globals from "./Globals";
import destructService from "./utils/destructService";

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
            Globals.issuesGarbageCollector = await new IssuesGarbageCollector({
                interval: 1000 * 60 * 30,
            }).start();
            Globals.pullRequestsGarbageCollector = await new PullRequestsGarbageCollector({
                interval: 1000 * 60 * 30,
            }).start();
            Globals.checkSuitsGarbageCollector = await new CheckSuitsGarbageCollector({
                interval: 1000 * 60 * 30,
            }).start();
        }

        if (requiredFor("webserver")) {
            Globals.webHookServer = new WebServer(SystemConfig.getConfig<Config>().webHookServer);
        }
        if (requiredFor("drawEventsHandlers", "commandsProxy")) {
            Globals.telegramBot = Bot.init(
                SystemConfig.getConfig<Config>().bot.token,
                SystemConfig.getConfig<Config>().system.commandsProxy
            );
        }

        if (
            requiredFor(
                "commandsProxy",
                "webserver",
                "githubEventsHandlers",
                "commandsEventHandlers",
                "drawEventsHandlers"
            )
        ) {
            Globals.amqpDispatcher = await AmqpDispatcher.init();
        }

        Globals.pulseWebServer = new WebServer(SystemConfig.getConfig<Config>().pulseWebServer);

        await Globals.webHookServer?.start();
        await Globals.pulseWebServer?.start();
    } catch (error) {
        if (error instanceof FatalError) {
            throw error;
        }
        Logger.error("Unhandled non fatal error in main thread: ", error);
    }
}

async function shutDown(): Promise<void> {
    let noErr: boolean = true;
    Logger.info(`Shutting down application by "SIGTERM" sygnal...`);
    if (Globals.webHookServer) noErr = noErr && (await destructService(Globals.webHookServer, "WebHook Web Server"));
    if (Globals.telegramBot) noErr = noErr && (await destructService(Globals.telegramBot, "Telegram Bot"));
    if (Globals.amqpDispatcher) noErr = noErr && (await destructService(Globals.amqpDispatcher, "Amqp Dispatcher"));

    if (Globals.issuesGarbageCollector)
        noErr = noErr && (await destructService(Globals.issuesGarbageCollector, "Issues Garbage Collector"));
    if (Globals.pullRequestsGarbageCollector)
        noErr =
            noErr && (await destructService(Globals.pullRequestsGarbageCollector, "Pull Request Garbage Collector"));
    if (Globals.checkSuitsGarbageCollector)
        noErr = noErr && (await destructService(Globals.checkSuitsGarbageCollector, "Check Suits Garbage Collector"));

    if (Globals.dbConnection) {
        Logger.silly(`Stopping Database Connection.`);
        try {
            await Globals.dbConnection.close();
            Logger.silly(`Database Connection successfully stopped.`);
        } catch (error) {
            Logger.error(`Database Connection stopped with error: ` + error);
            noErr = noErr && true;
        }
    }

    if (Globals.pulseWebServer) noErr = noErr && (await destructService(Globals.pulseWebServer, "Pulse Web Server"));

    if (noErr) {
        Logger.info(`Application successfully shut down.`);
        process.exit(0);
    } else {
        Logger.error(`Application shut down with errors.`);
        process.exit(1);
    }
}

process.on("SIGTERM", shutDown);
process.on("SIGINT", shutDown);
