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

import Controller from "../core/webserver/Controller";
import {Context, Next} from "koa";
import {Logger} from "../core/logger/Logger";
import SystemConfig from "../core/SystemConfig";
import Config from "../interfaces/Config";
import AmqpDispatcher from "../core/amqp/AmqpDispatcher";
import JSONObject from "../core/interfaces/JSONObject";
import HttpError from "../errors/HttpError";
import Ajv, {ValidateFunction} from "ajv";
import addAjvFormats from "ajv-formats";
import * as githubWebhookSchema from "@octokit/webhooks-schemas";


/**
 * GithubWebhookController - HTTP controller for handling GitHub requests.
 * @class
 * @author Danil Andreev
 */
@Controller.HTTPController("")
class GithubWebhookController extends Controller {
    /**
     * eventValidator- GitHub webhook event AJV validator.
     */
    protected static eventValidator: ValidateFunction;

    /**
     * Creates an instance of HTTPController;
     * @constructor
     * @author Danil Andreev
     */
    public constructor() {
        super();
        const ajv = new Ajv({strict: true});
        addAjvFormats(ajv);
        ajv.addKeyword("tsAdditionalProperties");
        GithubWebhookController.eventValidator = ajv.compile(githubWebhookSchema);
    }

    /**
     * Controller for [POST] /github
     * Handles GitHub webhook request.
     * @throws HttpError
     * @author Danil Andreev
     */
    @Controller.Route("POST", "/github")
    @Controller.RouteValidation(GithubWebhookController.webhookValidateMiddleware)
    public async webhookEvent(ctx: Context): Promise<void> {
        try {
            const payload: JSONObject = ctx.request.body;
            const event: string | undefined = ctx.request.get("x-github-event");
            Logger.debug(`Got WebHook message. Event: ${event || "NOT PASSED"}. Origin: ${ctx.req.url}`);
            if (!event) throw new Error(`Failed to get event from "x-github-event" header.`);
            if (SystemConfig.getConfig<Config>().webHookServer.acceptEvents.includes(event))
                await AmqpDispatcher.getCurrent().sendToQueue(event, {payload, ctx}, {expiration: 1000 * 60 * 30});
            else throw new Error(`Event ${event} is not supported`);
            ctx.status = 200;
        } catch (error) {
            Logger.http(`Incorrect webhook request. Origin: ${ctx.req.url}. ${error}`);
            throw new HttpError("Incorrect webhook request. " + error.message, 400);
        }
    }

    /**
     * webhookValidateMiddleware - middleware for webhook payload validation.
     * @method
     * @param ctx - Koa HTTP context.
     * @param next - Next middleware.
     * @throws HttpError
     * @author Danil Andreev
     */
    public static async webhookValidateMiddleware(ctx: Context, next: Next): Promise<void> {
        if (GithubWebhookController.eventValidator(ctx.request.body)) {
            await next();
        } else {
            Logger.warn(`Got GitHub WebHook message. Payload validation failed.`);
            throw new HttpError("Validation error", 400).setData({
                validation: GithubWebhookController.eventValidator.errors,
            });
        }
    }
}

export default GithubWebhookController;
