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

import * as Koa from "koa";
import {Context, Next} from "koa";
import * as BodyParser from "koa-bodyparser";
import {setupDbConnection} from "./core/DataBase";
import config from "./config";
import eventsMiddleware from "./core/eventsMiddleware";
import * as Amqp from "amqplib";
import setupAmqp from "./core/setupAmqp";
import Bot from "./core/Bot";
import WebServer from "./core/WebServer";


export let RabbitMQ: Amqp.Connection;

export default async function main() {
    await setupDbConnection();
    RabbitMQ = await Amqp.connect(config.rabbitmq);
    await setupAmqp();

    // const server = new Koa();
    // server.use(BodyParser());
    //
    // server.use(async (ctx: Context, next: Next) => {
    //     console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
    //     console.log(ctx);
    //     console.log("--- BODY -----------------------------------------------------------------");
    //     console.log(ctx.request.body);
    //
    //     let a = JSON.parse(ctx.request.body.payload);
    //
    //     ctx.body = "Hello"
    //     await next;
    // });
    //
    // server.use(eventsMiddleware);
    //
    //
    //
    // console.log("Server is listening on port", process.env.PORT || config.server.port);

    const server = new WebServer();

    Bot.init();
    server.start();
    // server.listen(process.env.PORT || config.server.port);
}
