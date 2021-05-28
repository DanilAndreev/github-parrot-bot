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
import TelegramEventsHandler from "./handlers/telegram/TelegramEventsHandler";
import VersionCommand from "./commands/VersionCommand";
import PullRequestCallbacksHandler from "./handlers/telegram/callbacks/PullRequestCallbacksHandler";
import IssueCallbacksHandler from "./handlers/telegram/callbacks/IssueCallbacksHandler";
import WebHookSettingsHandler from "./handlers/telegram/callbacks/WebHookSettingsHandler";
import WebHookSettingsCommand from "./commands/WebHookSettingsCommand";
import DrawWebHookSettingsHandler from "./handlers/draw/DrawWebHookSettingsHandler";
import DrawPushHandler from "./handlers/draw/DrawPushHandler";
import GithubWebhookController from "./controllers/GithubWebhookController";
import PulseController from "./controllers/PulseController";

const config: Config = {
    bot: {
        token: "you-should-pass-telegram-token-as-env-variable",
        commands: [
            AddRepositoryCommand,
            AKAsCommand,
            ClearAKACommand,
            ConnectCommand,
            DisconnectCommand,
            ListRepositoriesCommand,
            RemoveRepositoryCommand,
            VersionCommand,
            WebHookSettingsCommand,
        ],
        callbackQueryHandlers: [PullRequestCallbacksHandler, IssueCallbacksHandler, WebHookSettingsHandler],
    },
    db: {
        type: "postgres",
        url: "you-should-pass-database-url-as-env-variable",
        entities: [
            WebHook,
            WebHook.WebHookSettings,
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
        connect: "you-should-pass-amqp-url-as-env-variable",
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
            DrawWebHookSettingsHandler,
            DrawPushHandler,

            CommandsHandler,
            TelegramEventsHandler,
        ],
    },
    webHookServer: {
        port: 3030,
        acceptEvents: ["check_run", "check_suite", "create", "pull_request", "push", "issues"],
        controllers: [
            GithubWebhookController,
        ],
        metricsUpdateInterval: 5000,
    },
    pulseWebServer: {
        port: 3100,
        controllers: [
            PulseController,
        ],
        metricsUpdateInterval: 5000,
    },
    system: {
        metricsUpdateInterval: 5000,
    },
    log: {
        logLevel: "error",
    },
};

export default config;
