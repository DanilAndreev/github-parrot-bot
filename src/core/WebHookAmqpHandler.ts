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

import AmqpHandler from "./AmqpHandler";
import * as Crypto from "crypto";
import Issue from "../entities/Issue";
import * as moment from "moment";
import Chat from "../entities/Chat";
import CommandError from "../errors/CommandError";
import PullRequest from "../entities/PullRequest";
import CheckSuite from "../entities/CheckSuite";


export default class WebHookAmqpHandler extends AmqpHandler {
    static checkSignature(incomingSignature: string, payload: any, key: string): boolean {
        const expectedSignature = "sha1=" + Crypto.createHmac("sha1", key)
            .update(JSON.stringify(payload))
            .digest("hex");
        return expectedSignature === incomingSignature;
    }

    public static async useIssue(issueId: number, chatId: number): Promise<number> {
        const chat: Chat | undefined = await Chat.findOne({where: {chatId}});
        if (!chat)
            throw new CommandError(`Error accessing to chat. Try to kick the bot and invite it again.`);

        const result: Issue | undefined = await Issue.findOne({where: {chat, issueId}});
        if (result) {
            // const t1 = result?.updatedAt && moment.utc(result.updatedAt.toDateString()).format("lll")
            // const t2 = moment.utc().subtract(1, "hour").format("lll")
            if (result?.updatedAt && moment.utc(result.updatedAt) < moment.utc().subtract(1, "hour")) {
                await result.remove();
                return 0;
            }
            await result.save();
            return result.messageId;
        }
        throw new Error();
    }

    public static async usePullRequest(pullRequestId: number, chatId: number): Promise<number> {
        const chat: Chat | undefined = await Chat.findOne({where: {chatId}});
        if (!chat)
            throw new CommandError(`Error accessing to chat. Try to kick the bot and invite it again.`);

        const result: PullRequest | undefined = await PullRequest.findOne({where: {chat, pullRequestId}});
        if (result) {
            if (result?.updatedAt && moment.utc(result.updatedAt) < moment.utc().subtract(1, "hour")) {
                await result.remove();
                return 0;
            }
            await result.save();
            return result.messageId;
        }
        throw new Error();
    }

    public static async useCheckSuite(suiteId: number, chatId: number): Promise<number> {
        const chat: Chat | undefined = await Chat.findOne({where: {chatId}});
        if (!chat)
            throw new CommandError(`Error accessing to chat. Try to kick the bot and invite it again.`);

        const result: CheckSuite | undefined = await CheckSuite.findOne({where: {chat, suiteId}});
        if (result) {
            if (result?.updatedAt && moment.utc(result.updatedAt) < moment.utc().subtract(1, "hour")) {
                await result.remove();
                return 0;
            }
            await result.save();
            return result.messageId;
        }
        throw new Error();
    }
}
