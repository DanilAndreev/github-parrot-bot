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

import WebHook from "../../entities/WebHook";
import {CheckRun as CheckRunType, CheckSuite as CheckSuiteType} from "github-webhook-event-types";
import WebHookAmqpHandler from "../../core/amqp/WebHookAmqpHandler";
import CheckRun from "../../entities/CheckRun";
import CheckSuiteHandler from "./CheckSuiteHandler";
import CheckSuite from "../../entities/CheckSuite";
import AMQPAck from "../../errors/AMQPAck";
import DrawPullRequestEvent from "../../events/draw/DrawPullRequestEvent";
import DrawCheckSuiteEvent from "../../events/draw/DrawCheckSuiteEvent";

@WebHookAmqpHandler.Handler("check_run", 10)
@Reflect.metadata("amqp-handler-type", "github-event-handler")
export default class CheckRunHandler extends WebHookAmqpHandler {
    protected async handleHook(webHook: WebHook, payload: CheckRunType): Promise<boolean | void> {
        const {action, check_run, repository, sender} = payload;

        if (check_run.check_suite.pull_requests.length) {
            if (!webHook.settings.trackPullRequestCI)
                throw new AMQPAck("WebHook setting 'trackPullRequestCI' is disabled.");
        } else {
            if (!webHook.settings.trackFreeCI) throw new AMQPAck("WebHook setting 'trackFreeCI' is disabled.");
        }

        await new CheckSuiteHandler().handleHook(
            webHook,
            {check_suite: check_run.check_suite} as CheckSuiteType,
            false
        );

        const suite: CheckSuite | undefined = await CheckSuite.findOne({
            where: {suiteId: check_run.check_suite.id, chat: webHook.chat},
            relations: ["pullRequest", "chat", "runs"],
        });

        if (!suite) return;

        const info: CheckRun.Info = {
            status: check_run.status,
            name: check_run.name,
        };

        try {
            const entity: CheckRun = new CheckRun();
            entity.info = info;
            entity.runId = check_run.id;
            entity.suite = suite;
            await entity.save();
        } catch (error) {
            const entity: CheckRun | undefined = await CheckRun.findOne({where: {runId: check_run.id}});
            if (entity) {
                entity.info = info;
                entity?.save();
            }
        } finally {
            if (suite.pullRequest) {
                await new DrawPullRequestEvent(suite.pullRequest.id).enqueue();
            } else {
                await new DrawCheckSuiteEvent(suite.id).enqueue();
            }
        }
    }
}
