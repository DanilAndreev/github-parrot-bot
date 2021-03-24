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

import {RabbitMQ} from "../main";
import * as Amqp from "amqplib";
import {AMQP_ISSUES_QUEUE, AMQP_PULL_REQUESTS_QUEUE} from "../globals";
import issueHandler from "../handlers/issueHandler";

export default async function setupAmqp(): Promise<void> {
    const issuesChannel: Amqp.Channel = await RabbitMQ.createChannel();
    await issuesChannel.assertQueue(AMQP_ISSUES_QUEUE);
    await issuesChannel.prefetch(10);
    await issuesChannel.consume(AMQP_ISSUES_QUEUE, (msg) => msg && issueHandler(msg, issuesChannel));

    const pullRequestsChannel: Amqp.Channel = await RabbitMQ.createChannel();
    await pullRequestsChannel.assertQueue(AMQP_PULL_REQUESTS_QUEUE);
    await pullRequestsChannel.prefetch(10);
    await pullRequestsChannel.consume(AMQP_PULL_REQUESTS_QUEUE, (msg) => msg && issueHandler(msg, pullRequestsChannel));
}