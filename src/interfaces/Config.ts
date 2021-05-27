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

import BotCommand from "../core/bot/BotCommand";
import AmqpHandler from "../core/amqp/AmqpHandler";
import {ConnectionOptions} from "typeorm";
import * as AMQP from "amqplib";
import Constructable from "./Constructable";
import Controller from "../core/webserver/Controller";
import WebServer from "../core/webserver/WebServer";

namespace Config {
    /**
     * Bot - telegram bot configuration settings.
     * @interface
     * @author Danil Andreev
     */
    export interface Bot {
        token: string;
        tag?: string;
        commands: typeof BotCommand[];
        callbackQueryHandlers?: Constructable[];
    }

    /**
     * Server - webhooks processing web server configuration settings.
     * @interface
     * @author Danil Andreev
     */
    export interface WebHookServer extends WebServer.Config {
        acceptEvents: string[];
    }

    /**
     * Amqp - AMQP client configuration settings.
     * @interface
     * @author Danil Andreev
     */
    export interface Amqp {
        connect: string | AMQP.Options.Connect;
        handlers: typeof AmqpHandler[];
    }

    /**
     * System - system configuration settings.
     * @interface
     * @author Danil Andreev
     */
    export interface System {
        commandsProxy?: boolean;
        webserver?: boolean;
        githubEventsHandlers?: boolean;
        commandsEventHandlers?: boolean;
        drawEventsHandlers?: boolean;
        cronDatabaseGarbageCollectors?: boolean;
    }

    export interface Log {
        logLevel?: string;
        databaseUrl?: string;
        databaseLogLevel?: string;
        databaseTable?: string;
    }
}

/**
 * Config - interface for system configuration.
 * @interface
 * @author Danil Andreev
 */
interface Config {
    bot: Config.Bot;
    db: ConnectionOptions;
    webHookServer: Config.WebHookServer;
    pulseWebServer: WebServer.Config;
    amqp: Config.Amqp;
    system: Config.System;
    log: Config.Log;
}

export default Config;
