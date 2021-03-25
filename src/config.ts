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
import {ConnectionOptions} from "typeorm";
import Collaborator from "./entities/Collaborator";
import * as Amqp from "amqplib";
import Issue from "./entities/Issue";
import AddRepositoryCommand from "./commands/AddRepositoryCommand";
import AKAsCommand from "./commands/AKAsCommand";
import ClearAKACommand from "./commands/ClearAKACommand";
import ConnectCommand from "./commands/ConnectCommand";
import DisconnectCommand from "./commands/DisconnectCommand";
import ListRepositoriesCommand from "./commands/ListRepositoriesCommand";
import RemoveRepositoryCommand from "./commands/RemoveRepositoryCommand";
import BotCommand from "./core/BotCommand";
import WebHookEvent from "./core/WebHookEvent";
import IssueEvent from "./events/IssueEvent";
import PullRequestEvent from "./events/PullRequestEvent";
import AmqpHandler from "./core/AmqpHandler";
import IssuesHandler from "./handlers/IssuesHandler";
import PullRequestsHandler from "./handlers/PullRequestsHandler";

namespace Config {
    export interface Bot {
        token: string;
        commands: typeof BotCommand[]
    }

    export interface Server {
        port: number;
        handlers: typeof WebHookEvent[];
    }

    export interface Amqp {
        connect: string | Amqp.Options.Connect,
        handlers: typeof AmqpHandler[]
    }

}

interface Config {
    bot: Config.Bot;
    db: ConnectionOptions;
    server: Config.Server;
    amqp: Config.Amqp,
}

export default Config;

export const config: Config = {
    bot: {
        token: process.env.TELEGRAM_BOT_TOKEN || "",
        commands: [
            AddRepositoryCommand,
            AKAsCommand,
            ClearAKACommand,
            ConnectCommand,
            DisconnectCommand,
            ListRepositoriesCommand,
            RemoveRepositoryCommand
        ]
    },
    db: {
        type: "postgres",
        url: process.env.DATABASE_URL,
        entities: [
            WebHook, Collaborator, Issue
        ],
        ssl: {
            rejectUnauthorized: false,
        }
    },
    amqp: {
        connect: process.env.CLOUDAMQP_URL || "",
        handlers: [IssuesHandler, PullRequestsHandler]
    },
    server: {
        port: process.env.PORT ? +process.env.PORT : 3030,
        handlers: [IssueEvent, PullRequestEvent],
    }
}
