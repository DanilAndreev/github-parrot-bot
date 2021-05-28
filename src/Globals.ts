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

import WebServer from "./core/webserver/WebServer";
import AmqpDispatcher from "./core/amqp/AmqpDispatcher";
import Bot from "./core/bot/Bot";
import Chrono from "./core/Chrono";
import {Connection} from "typeorm";

export default class Globals {
    public static webHookServer: WebServer | null = null;
    public static telegramBot: Bot | null = null;
    public static pulseWebServer: WebServer | null = null;
    public static amqpDispatcher: AmqpDispatcher | null = null;
    public static checkSuitsGarbageCollector: Chrono | null = null;
    public static issuesGarbageCollector: Chrono | null = null;
    public static pullRequestsGarbageCollector: Chrono | null = null;
    public static dbConnection: Connection | null = null;
}

export const QUEUES = {
    PULL_REQUEST_SHOW_QUEUE: "pull-request-show-queue",
    ISSUE_SHOW_QUEUE: "issue-show-queue",
    CHECK_SUITE_SHOW_QUEUE: "check-suite-show-queue",
    WEB_HOOK_SETTINGS_SHOW_QUEUE: "web-hook-settings-show-queue",
    PUSH_SHOW_QUEUE: "push-show-queue",
    TELEGRAM_CHAT_COMMAND: "telegram-chat-command",
    DRAW_TELEGRAM_MESSAGE_QUEUE: "messages",
    TELEGRAM_EVENTS_QUEUE: "telegram-events-queue",
};
