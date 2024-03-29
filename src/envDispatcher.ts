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

import Ref from "./core/interfaces/Ref";
import SystemConfig from "./core/SystemConfig";
import Config from "./interfaces/Config";
import JSONObject from "./core/interfaces/JSONObject";

/**
 * envDispatcher - function, designed to place variables from env to right places in config.
 * @function
 * @author Danil Andreev
 */
export default function envDispatcher(
    configRef: Ref<Config>,
    value: string,
    execArray: RegExpExecArray,
    regExp: RegExp
): void {
    try {
        const name: string = execArray[1].toLowerCase();
        switch (name) {
            case "cloudamqp_url":
                configRef.current.amqp.connect = value;
                break;

            case "cloudamqp_host":
                if (typeof configRef.current.amqp.connect !== "object") configRef.current.amqp.connect = {}
                configRef.current.amqp.connect.hostname = value;
                break;
            case "cloudamqp_port":
                if (typeof configRef.current.amqp.connect !== "object") configRef.current.amqp.connect = {}
                configRef.current.amqp.connect.port = +value;
                break;
            case "cloudamqp_user":
                if (typeof configRef.current.amqp.connect !== "object") configRef.current.amqp.connect = {}
                configRef.current.amqp.connect.username = value;
                break;
            case "cloudamqp_password":
                if (typeof configRef.current.amqp.connect !== "object") configRef.current.amqp.connect = {}
                configRef.current.amqp.connect.password = value;
                break;

            case "database_url":
                (configRef.current.db as JSONObject).url = value;
                break;
            case "database_host":
                (configRef.current.db as JSONObject).host = value;
                break;
            case "database_port":
                (configRef.current.db as JSONObject).port = +value;
                break;
            case "database_password":
                (configRef.current.db as JSONObject).password = value;
                break;
            case "database_database":
                (configRef.current.db as JSONObject).database = value;
                break;
            case "database_ssl":
                (configRef.current.db as JSONObject).ssl = value === "true" ? {rejectUnauthorized: false} : false;
                break;

            case "logs_database_url":
                configRef.current.log.databaseUrl = value;
                break;
            case "logs_database_level":
                configRef.current.log.databaseLogLevel = value;
                break;
            case "logs_database_table":
                configRef.current.log.databaseTable = value;
                break;

            case "telegram_bot_token":
                configRef.current.bot.token = value;
                break;
            case "telegram_tag":
                configRef.current.bot.tag = value;
                break;

            case "port":
                configRef.current.webHookServer.port = +value;
                break;

            case "pulse_port":
                configRef.current.pulseWebServer.port = +value;
                break;

            case "enable_webserver":
                configRef.current.system.webserver = value === "true" && true;
                break;
            case "enable_github_events_handlers":
                configRef.current.system.githubEventsHandlers = value === "true" && true;
                break;
            case "enable_commands_events_handlers":
                configRef.current.system.commandsEventHandlers = value === "true" && true;
                break;
            case "enable_draw_events_handlers":
                configRef.current.system.drawEventsHandlers = value === "true" && true;
                break;
            case "enable_cron_database_garbage_collectors":
                configRef.current.system.cronDatabaseGarbageCollectors = value === "true" && true;
                break;
            case "enable_commands_proxy":
                configRef.current.system.commandsProxy = value === "true" && true;
                break;

            case "log_level":
                configRef.current.log.logLevel = value;
                break;

            default:
                SystemConfig.defaultEnvDispatcher(configRef, value, execArray, regExp);
        }
    } catch (error) {
        console.error(`Invalid ENV variable "${execArray.input}", skipping. Details:\n`, error.message);
    }
}
