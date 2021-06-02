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
import Globals from "../Globals";
import Metricable from "../core/interfaces/Metricable";
import SystemConfig from "../core/SystemConfig";
import Config from "../interfaces/Config";
import JSONObject from "../core/interfaces/JSONObject";

@Controller.HTTPController("")
class PulseController extends Controller {
    private static StatusesValues = {
        stopped: 0,
        idle: 100,
        running: 200,
    };

    @Controller.Route("GET", "/pulse")
    public async pulse(ctx: Context): Promise<void> {
        ctx.body = {
            status: PulseController.getCommonStatus(),
            application: "Github Parrot Bot",
            version: "UNKNOWN",
        };
        // ctx.body.status = PulseController.getCommonStatus();
        // ctx.body.application = "Github Parrot Bot";
        // ctx.body.version = "UNKNOWN";
    }

    @Controller.Route("GET", "/metrics")
    public async metrics(ctx: Context): Promise<void> {
        const {
            drawEventsHandlers,
            cronDatabaseGarbageCollectors,
            commandsEventHandlers,
            commandsProxy,
            githubEventsHandlers,
            webserver,
        } = SystemConfig.getConfig<Config>().system;
        const body: JSONObject = {};
        body.draw_events_handlers_enabled = drawEventsHandlers;
        body.cron_garbage_collectors_enabled = cronDatabaseGarbageCollectors;
        body.telegram_commands_handlers_enabled = commandsEventHandlers;
        body.telegram_commands_proxy_enabled = commandsProxy;
        body.webhook_events_handlers_enabled = githubEventsHandlers;
        body.webhook_web_server_enabled = webserver;

        body.pulse_web_server_status = PulseController.getStatus(Globals.pulseWebServer);
        body.pulse_web_server_load = Globals.pulseWebServer?.getMetrics();
        if (webserver) {
            body.webhook_web_server_status = PulseController.getStatus(Globals.webHookServer);
            body.webhook_web_server_load = Globals.webHookServer?.getMetrics();
        }
        if (commandsProxy) {
            body.telegram_commands_proxy_status = PulseController.getStatus(Globals.telegramBot);
            body.telegram_commands_proxy_load = Globals.telegramBot?.getMetrics();
        }
        body.amqp_handlers_status = PulseController.getStatus(Globals.amqpDispatcher);
        body.amqp_handlers_load = Globals.amqpDispatcher?.getMetrics();

        body.status = PulseController.getCommonStatus();
        body.activeHttpSessions = Globals.webHookServer?.getMetrics();

        for (const key in body) if (body[key] === undefined) delete body[key];
        ctx.body = body;
    }

    public static getCommonStatus(): string {
        const services: (Metricable | null)[] = [Globals.webHookServer, Globals.pulseWebServer, Globals.telegramBot];

        return services.reduce<string>((previous: string, current: Metricable | null) => {
            const status: string = this.getStatus(current);
            if (this.StatusesValues[status] > this.StatusesValues[previous]) return status;
            else return previous;
        }, "stopped");
    }

    public static getStatus(target: Metricable | null): string {
        if (!target) return "stopped";
        if (target.getMetrics()) return "running";
        return "idle";
    }
}

export default PulseController;
