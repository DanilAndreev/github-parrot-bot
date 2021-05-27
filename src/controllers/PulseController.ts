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
import {Context} from "koa";
import WebServer from "../core/webserver/WebServer";

@Controller.HTTPController("/pulse")
class PulseController extends Controller {
    @Controller.Route("GET", "/")
    public async pulse(ctx: Context): Promise<void> {
        ctx.body = {};
        ctx.body.status = PulseController.getStatus();
        ctx.body.application = "Github Parrot Bot";
        ctx.body.version = "UNKNOWN";
    }

    @Controller.Route("GET", "/metrics")
    public async metrics(ctx: Context): Promise<void> {
        ctx.body = {};
        ctx.body.status = PulseController.getStatus();
        ctx.body.activeHttpSessions = WebServer.getActiveHttpSessionsQuantity();
    }

    public static getStatus(): string {
        if (WebServer.getActiveHttpSessionsQuantity() > 1) return "running";
        return "idle";
    }
}

export default PulseController;
