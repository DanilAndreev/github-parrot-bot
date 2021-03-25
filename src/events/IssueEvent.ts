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

import WebHookEvent from "../core/WebHookEvent";
import {Issues} from "github-webhook-event-types";
import * as Amqp from "amqplib";
import {RabbitMQ} from "../main";
import {AMQP_ISSUES_QUEUE} from "../globals";


@WebHookEvent.Target("issue")
/**
 * IssueEvent - class for handling WebHook issue events.
 * @class
 * @author Danil Andreev
 */
export default class IssueEvent extends WebHookEvent {
    public async handle(event: WebHookEvent.WebHookPayload<Issues>): Promise<void> {
        const {payload, ctx} = event;
        const channel: Amqp.Channel = await RabbitMQ.createChannel();
        await channel.assertQueue(AMQP_ISSUES_QUEUE);
        channel.sendToQueue(AMQP_ISSUES_QUEUE, new Buffer(JSON.stringify({payload, ctx})));
    }
}
