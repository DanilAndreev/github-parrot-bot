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
import {Logger} from "../logger/Logger";
import HttpError from "../../errors/HttpError";
import Controller from "./Controller";
import * as Router from "koa-router";
import Metricable from "../interfaces/Metricable";

/**
 * WebServer - web server for handling WebHooks.
 * @class
 * @author Danil Andreev
 */
class WebServer extends Koa implements Metricable {
    /**
     * metricsPrev - quantity of currently active HTTP sessions for last 5 seconds.
     */
    private metricsPrev: number;

    /**
     * metricsActive - quantity of currently active HTTP sessions live encounter. Not shown;
     */
    private metricsActive: number;

    /**
     * metricsInterval - Interval for calculating metrics.
     */
    public readonly metricsInterval: NodeJS.Timeout;

    /**
     * router - Root server router. Other routers used by it.
     */
    protected readonly router: Router;

    /**
     * port - target serving port.
     */
    public port: number;

    /**
     * Creates an instance of WebServer.
     * @constructor
     * @author Danil Andreev
     */
    constructor(config: WebServer.Config) {
        super();
        this.router = new Router();
        this.port = config.port;

        this.metricsActive = 0;
        this.metricsPrev = 0;
        this.metricsInterval = setInterval(() => {
            this.metricsPrev = this.metricsActive;
            this.metricsActive = 0;
        }, config.metricsUpdateInterval);

        this.use(async (ctx: Context, next: Next) => await this.activeHttpSessionsCounterMiddleware(ctx, next));
        this.use(async (ctx: Context, next: Next) => await WebServer.httpErrorsMiddleware(ctx, next));
        this.use(BodyParser());

        const controllers: typeof Controller[] = config.controllers;
        for (const controller of controllers) {
            const instance: Controller = new controller();
            this.router.use(instance.baseRoute, instance.routes(), instance.allowedMethods());
        }
        this.use(this.router.routes());
    }

    /**
     * getMetrics - returns quantity of currently active HTTP sessions on the web server.
     * @method
     * @author Danil Andreev
     */
    public getMetrics(): number {
        return this.metricsPrev;
    }

    public release(): void {
        clearInterval(this.metricsInterval);
    }

    /**
     * activeHttpSessionsCounterMiddleware - middleware for counting active HTTP sessions.
     * @method
     * @param ctx - Koa HTTP context.
     * @param next - Next middleware.
     * @author Danil Andreev
     */
    private async activeHttpSessionsCounterMiddleware(ctx: Context, next: Next): Promise<void> {
        this.metricsActive++;
        await next();
    }

    /**
     * httpErrorsMiddleware - middleware for handling HttpError.
     * @method
     * @param ctx - Koa HTTP context.
     * @param next - Next middleware.
     * @throws Error
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
        const targetPort: number = port || this.port || 3030;
        Logger.info(`Web server started on port ${targetPort}.`);
        this.listen(targetPort);
        return this;
    }
}

namespace WebServer {
    /**
     * Server - web server configuration settings.
     * @interface
     * @author Danil Andreev
     */
    export interface Config {
        /**
         * port - target server port.
         */
        port: number;
        /**
         * controllers - controllers list.
         */
        controllers: typeof Controller[];
        metricsUpdateInterval: number;
    }
}

export default WebServer;
