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
import Config from "../../interfaces/Config";
import SystemConfig from "../SystemConfig";
import {Logger} from "../logger/Logger";
import HttpError from "../../errors/HttpError";
import Controller from "./Controller";
import * as Router from "koa-router";

/**
 * WebServer - web server for handling WebHooks.
 * @class
 * @author Danil Andreev
 */
class WebServer extends Koa {
    /**
     * router - Root server router. Other routers used by it.
     * @readonly
     */
    protected readonly router: Router;

    /**
     * Creates an instance of WebServer.
     * @constructor
     * @author Danil Andreev
     */
    constructor() {
        super();
        this.router = new Router();
        this.use(async (ctx: Context, next: Next) => await WebServer.httpErrorsMiddleware(ctx, next));
        this.use(BodyParser());

        const controllers: typeof Controller[] = SystemConfig.getConfig<Config>().server.controllers;
        for (const controller of controllers) {
            const instance: Controller = new controller();
            this.router.use(instance.baseRoute, instance.routes(), instance.allowedMethods());
        }
        this.use(this.router.routes());
    }

    /**
     * httpErrorsMiddleware - middleware for handling HttpError.
     * @method
     * @param ctx - Koa HTTP context.
     * @param next - Next middleware.
     * @author Danil Andreev
     */
    public static async httpErrorsMiddleware(ctx: Context, next: Next): Promise<void> {
        try {
            await next();
        } catch (error) {
            if (error instanceof HttpError) {
                Logger?.debug(`Http Request error(${error.code}): ${error.message}`);
                ctx.status = error.code;
                ctx.body = error.getResponseMessage();
            } else {
                throw error;
            }
        }
    }

    /**
     * start - starts the server.
     * @method
     * @param port - Target port. If not defined - will be taken from env or config.
     * @author Danil Andreev
     */
    public start(port?: number): WebServer {
        const targetPort: number = port || SystemConfig.getConfig<Config>().server.port || 3030;
        Logger?.info(`Web server started on port ${targetPort}.`);
        this.listen(targetPort);
        return this;
    }
}

export default WebServer;
