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

import ApplicationContext from "./core/interfaces/ApplicationContext";
import {setupDbConnection} from "./core/DataBase";
import IssuesGarbageCollector from "./chrono/IssuesGarbageCollector";
import PullRequestsGarbageCollector from "./chrono/PullRequestsGarbageCollector";
import CheckSuitsGarbageCollector from "./chrono/CheckSuitsGarbageCollector";
import WebServer from "./core/webserver/WebServer";
import SystemConfig from "./core/SystemConfig";
import Config from "./interfaces/Config";
import BotSingleton from "./classes/BotSingleton";
import AmqpDispatcherSingleton from "./classes/AmqpDispathcerSingleton";
import FatalError from "./core/errors/FatalError";
import {Logger} from "./core/logger/Logger";
import destructService from "./utils/destructService";
import Destructable from "./core/interfaces/Destructable";
import StaticImplements from "./core/utils/staticImplements";

@StaticImplements<Destructable>()
export default class Application {
    static context: ApplicationContext = {
        webHookServer: null,
        telegramBot: null,
        pulseWebServer: null,
        amqpDispatcher: null,
        checkSuitsGarbageCollector: null,
        issuesGarbageCollector: null,
        pullRequestsGarbageCollector: null,
        dbConnection: null,
    };

    protected static requiredFor(...args: string[]): boolean {
        return args.some((key: string) => SystemConfig.getConfig<Config>().system[key]);
    }

    public static async main(): Promise<void> {
        try {
            if (
                this.requiredFor(
                    "drawEventsHandlers",
                    "commandsEventHandlers",
                    "githubEventsHandlers",
                    "cronDatabaseGarbageCollectors"
                )
            ) {
                await setupDbConnection();
            }
            if (this.requiredFor("cronDatabaseGarbageCollectors")) {
                this.context.issuesGarbageCollector = await new IssuesGarbageCollector({
                    interval: 1000 * 60 * 30,
                }).start();
                Reflect.defineMetadata("application-context", this.context, this.context.issuesGarbageCollector);
                this.context.pullRequestsGarbageCollector = await new PullRequestsGarbageCollector({
                    interval: 1000 * 60 * 30,
                }).start();
                Reflect.defineMetadata("application-context", this.context, this.context.pullRequestsGarbageCollector);
                this.context.checkSuitsGarbageCollector = await new CheckSuitsGarbageCollector({
                    interval: 1000 * 60 * 30,
                }).start();
                Reflect.defineMetadata("application-context", this.context, this.context.checkSuitsGarbageCollector);
            }

            if (this.requiredFor("webserver")) {
                this.context.webHookServer = new WebServer(SystemConfig.getConfig<Config>().webHookServer);
                Reflect.defineMetadata("application-context", this.context, this.context.webHookServer);
            }
            if (this.requiredFor("drawEventsHandlers", "commandsProxy")) {
                this.context.telegramBot = BotSingleton.getCurrent();
                Reflect.defineMetadata("application-context", this.context, this.context.telegramBot);
            }

            if (
                this.requiredFor(
                    "commandsProxy",
                    "webserver",
                    "githubEventsHandlers",
                    "commandsEventHandlers",
                    "drawEventsHandlers"
                )
            ) {
                this.context.amqpDispatcher = await AmqpDispatcherSingleton.getCurrent();
                Reflect.defineMetadata("application-context", this.context, this.context.amqpDispatcher);
            }

            this.context.pulseWebServer = new WebServer(SystemConfig.getConfig<Config>().pulseWebServer);
            Reflect.defineMetadata("application-context", this.context, this.context.pulseWebServer);

            await this.context.webHookServer?.start();
            await this.context.pulseWebServer?.start();
        } catch (error) {
            if (error instanceof FatalError) {
                throw error;
            }
            Logger.error("Unhandled non fatal error in main thread: ", error);
        }
    }

    public static async destruct(): Promise<void> {
        let noErr: boolean = true;
        Logger.info(`Shutting down application by "SIGTERM" sygnal...`);
        if (this.context.webHookServer) noErr = noErr && (await destructService(this.context.webHookServer, "WebHook Web Server"));
        if (this.context.telegramBot) noErr = noErr && (await destructService(this.context.telegramBot, "Telegram Bot"));
        if (this.context.amqpDispatcher) noErr = noErr && (await destructService(this.context.amqpDispatcher, "Amqp Dispatcher"));

        if (this.context.issuesGarbageCollector)
            noErr = noErr && (await destructService(this.context.issuesGarbageCollector, "Issues Garbage Collector"));
        if (this.context.pullRequestsGarbageCollector)
            noErr =
                noErr && (await destructService(this.context.pullRequestsGarbageCollector, "Pull Request Garbage Collector"));
        if (this.context.checkSuitsGarbageCollector)
            noErr = noErr && (await destructService(this.context.checkSuitsGarbageCollector, "Check Suits Garbage Collector"));

        if (this.context.dbConnection) {
            Logger.silly(`Stopping Database Connection.`);
            try {
                await this.context.dbConnection.close();
                Logger.silly(`Database Connection successfully stopped.`);
            } catch (error) {
                Logger.error(`Database Connection stopped with error: ` + error);
                noErr = noErr && true;
            }
        }

        if (this.context.pulseWebServer) noErr = noErr && (await destructService(this.context.pulseWebServer, "Pulse Web Server"));

        if (noErr) {
            Logger.info(`Application successfully shut down.`);
            process.exit(0);
        } else {
            Logger.error(`Application shut down with errors.`);
            process.exit(1);
        }
    }
}
