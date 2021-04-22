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
import {Context} from "koa";
import WebHook from "../../entities/WebHook";
import {Message} from "amqplib";

/**
 * WebHookAmqpHandler - base class for github webhook events AMQP handlers.
 * @class
 * @author Danil Andreev
 */
export default class WebHookAmqpHandler extends AmqpHandler {
    /**
     * checkSignature - checks GitHub signature with WebHook secret key.
     * @param incomingSignature - Incoming signature.
     * @param payload - incoming payload.
     * @param key - Secret key.
     */
    static checkSignature(incomingSignature: string, payload: any, key: string): boolean {
        const hmac: string = Crypto.createHmac("sha1", key).update(JSON.stringify(payload)).digest("hex");
        const expectedSignature = "sha1=" + hmac;
        return expectedSignature === incomingSignature;
    }

    /**
     * handle - handles AMQP message and looping over webhooks.
     * @method
     * @param content - AMQP message payload.
     * @param message - AMQP message.
     * @author Danil Andreev
     */
    protected async handle(content: any, message: Message): Promise<void | boolean> {
        const {payload, ctx}: {payload: any; ctx: Context} = content;
        const {repository} = payload;

        const webHooks: WebHook[] = await WebHook.find({
            where: {repository: repository.full_name},
            relations: ["chat", "settings"],
        });

        const promises: Promise<boolean | void>[] = [];

        for (const webHook of webHooks) {
            if (!WebHookAmqpHandler.checkSignature(ctx.request.header["x-hub-signature"], payload, webHook.secret)) {
                continue;
            }
            promises.push(this.handleHook(webHook, payload));
        }

        return !(await Promise.all(promises)).some(item => item == false);
    }

    /**
     * handleHook - handler for each webhook with the same signature.
     * @abstract
     * @method
     * @param webHook - Target WebHook entity object.
     * @param payload - Payload.
     * @author Danil Andreev
     */
    protected async handleHook(webHook: WebHook, payload: any): Promise<boolean | void> {
        throw new ReferenceError(`Abstract method call. Inherit this class and override this method.`);
    }
}
