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

import Bot from "../bot/Bot";
import AmqpDispatcher from "../amqp/AmqpDispatcher";
import WebServer from "../webserver/WebServer";
import Chrono from "../Chrono";
import {Connection} from "typeorm";

export default interface ApplicationContext {
    webHookServer?: WebServer | null;
    telegramBot?: Bot | null;
    pulseWebServer?: WebServer | null;
    amqpDispatcher?: AmqpDispatcher | null;
    checkSuitsGarbageCollector?: Chrono | null;
    issuesGarbageCollector?: Chrono | null;
    pullRequestsGarbageCollector?: Chrono | null;
    dbConnection?: Connection | null;
}
