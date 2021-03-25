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

import * as Koa from "koa";
import {Context, Next} from "koa";
import * as BodyParser from "koa-bodyparser";
import config from "../config";
import * as Amqp from "amqplib";
import AmqpDispatcher from "./AmqpDispatcher";


/**
 * WebServer - web server for handling WebHooks.
 * @class
 * @author Danil Andreev
 */
class WebServer extends Koa {
    /**
     * Creates an instance of WebServer.
     * @constructor
     * @author Danil Andreev
     */
    constructor() {
        super();
        this.use(BodyParser());
        this.use((ctx: Context, next: Next) => this.handleEventRequest(ctx, next));
    }

    /**
     * handleEventRequest - method for handling WebHook request and determine event type.
     * @method
     * @param ctx - Context.
     * @param next - Next.
     * @author Danil Andreev
     */
    protected async handleEventRequest(ctx: Context, next: Next) {
        try {
            const payload: any = ctx.request.body;
            const event = ctx.request.get("x-github-event");
            console.log(event);
            if (!event)
                throw new Error("Failed to get event.");
            const channel: Amqp.Channel = await AmqpDispatcher.getCurrent().getConnection().createChannel();
            await channel.assertQueue(event);
            channel.sendToQueue(event, new Buffer(JSON.stringify({payload, ctx})), {expiration: 1000*60*30});
            ctx.status = 200;
        } catch (error) {
            ctx.status = 400;
            ctx.body = "Incorrect webhook request." + error.message;
        }
        await next();
    }

    /**
     * start - starts the server.
     * @method
     * @param port - Target port. If not defined - will be taken from env or config.
     * @author Danil Andreev
     */
    public start(port?: number): WebServer {
        this.listen(port || process.env.PORT || config.server.port);
        return this;
    }
}

export default WebServer;
