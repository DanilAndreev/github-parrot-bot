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
import Collaborator from "./entities/Collaborator";
import Issue from "./entities/Issue";
import AddRepositoryCommand from "./commands/AddRepositoryCommand";
import AKAsCommand from "./commands/AKAsCommand";
import ClearAKACommand from "./commands/ClearAKACommand";
import ConnectCommand from "./commands/ConnectCommand";
import DisconnectCommand from "./commands/DisconnectCommand";
import ListRepositoriesCommand from "./commands/ListRepositoriesCommand";
import RemoveRepositoryCommand from "./commands/RemoveRepositoryCommand";
import IssuesHandler from "./handlers/webhook/IssuesHandler";
import PullRequestsHandler from "./handlers/webhook/PullRequestsHandler";
import Config from "./interfaces/Config";
import PushHandler from "./handlers/webhook/PushHandler";
import CheckRunHandler from "./handlers/webhook/CheckRunHandler";
import CheckSuiteHandler from "./handlers/webhook/CheckSuiteHandler";
import Chat from "./entities/Chat";
import CheckSuite from "./entities/CheckSuite";
import PullRequest from "./entities/PullRequest";
import CheckRun from "./entities/CheckRun";
import DrawIssueHandler from "./handlers/draw/DrawIssueHandler";
import DrawCheckSuiteHandler from "./handlers/draw/DrawCheckSuiteHandler";
import DrawPullRequestHandler from "./handlers/draw/DrawPullRequestHandler";
import CommandsHandler from "./handlers/telegram/CommandsHandler";
import DrawMessageHandler from "./handlers/draw/DrawMessageHandler";

const config: Config = {
    bot: {
        token: process.env.TELEGRAM_BOT_TOKEN || "",
        commands: [
            AddRepositoryCommand,
            AKAsCommand,
            ClearAKACommand,
            ConnectCommand,
            DisconnectCommand,
            ListRepositoriesCommand,
            RemoveRepositoryCommand,
        ],
    },
    db: {
        type: "postgres",
        url: process.env.DATABASE_URL,
        entities: [
            WebHook,
            Collaborator,
            Issue,
            Issue.IssueMessage,
            Chat,
            CheckSuite,
            CheckSuite.CheckSuiteMessage,
            PullRequest,
            PullRequest.PullRequestMessage,
            CheckRun,
        ],
        ssl: {
            rejectUnauthorized: false,
        },
    },
    amqp: {
        connect: process.env.CLOUDAMQP_URL || "",
        handlers: [
            IssuesHandler,
            PullRequestsHandler,
            PushHandler,
            CheckRunHandler,
            CheckSuiteHandler,

            DrawIssueHandler,
            DrawPullRequestHandler,
            DrawCheckSuiteHandler,
            DrawMessageHandler,
            CommandsHandler,
        ],
    },
    server: {
        port: process.env.PORT ? +process.env.PORT : 3030,
    },
};

export default config;
