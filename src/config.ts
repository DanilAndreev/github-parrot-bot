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

import WebHook from "./entities/WebHook";
import Chat from "./entities/Chat";
import {ConnectionOptions} from "typeorm";
import Collaborator from "./entities/Collaborator";
import * as Amqp from "amqplib";
import Issue from "./entities/Issue";

export interface BotConfig {
    token: string;
}

export interface ServerConfig {
    port: number;
}

export interface Config {
    bot: BotConfig;
    db: ConnectionOptions;
    server: ServerConfig;
    rabbitmq: string | Amqp.Options.Connect,
}

const config: Config = {
    bot: {
        token: process.env.TELEGRAM_BOT_TOKEN || "",
    },
    db: {
        type: "postgres",
        url: process.env.DATABASE_URL,
        entities: [
            Chat, WebHook, Collaborator, Issue
        ],
        ssl: {
            rejectUnauthorized: false,
        }
    },
    rabbitmq: process.env.CLOUDAMQP_URL || "",
    server: {
        port: process.env.PORT ? +process.env.PORT : 3030,
    }
}

export default config;