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

import * as Amqp from "amqplib";
import {Connection} from "amqplib";
import AmqpHandler from "./AmqpHandler";
import JSONObject from "../interfaces/JSONObject";
import Config from "../../interfaces/Config";
import SystemConfig from "../SystemConfig";
import {Logger} from "../logger/Logger";
import FatalError from "../../errors/FatalError";
import Metricable from "../interfaces/Metricable";
import Destructable from "../interfaces/Destructable";

/**
 * AmqpDispatcher - dispatcher for AMQP handlers.
 * @class
 * @author Danil Andreev
 */
class AmqpDispatcher implements Metricable, Destructable {
    /**
     * current - current class instance. Singleton.
     */
    protected static current: AmqpDispatcher;

    /**
     * handlers - AMQP handlers connected to dispathcer.
     */
    protected handlers: AmqpHandler[] = [];
    /**
     * connection - AMQP connection.
     */
    protected connection: Connection;

    /**
     * metricsPrev - quantity of queue items for last 5 seconds.
     */
    private metricsPrev: number;

    /**
     * metricsActive - quantity of queue items live encounter. Not shown;
     */
    private metricsActive: number;

    /**
     * metricsInterval - Interval for calculating metrics.
     */
    public readonly metricsInterval: NodeJS.Timeout;

    /**
     * Creates an instance of AmqpDispatcher.
     * @constructor
     * @param connection - AMQP connection object.
     * @throws Error
     * @throws TypeError
     * @author Danil Andreev
     */
    constructor(connection: Connection) {
        this.connection = connection;

        this.metricsActive = 0;
        this.metricsPrev = 0;
        this.metricsInterval = setInterval(() => {
            this.metricsPrev = this.metricsActive;
            this.metricsActive = 0;
        }, SystemConfig.getConfig<Config>().system.metricsUpdateInterval);

        this.handlers = SystemConfig.getConfig<Config>()
            .amqp.handlers.filter((HandlerClass: typeof AmqpHandler): boolean =>
                AmqpDispatcher.determineHandlerIsRequired(HandlerClass)
            )
            .map((HandlerClass: typeof AmqpHandler) => new HandlerClass());

        for (const handler of this.handlers) {
            this.hook(handler).catch((error: Error) => {
                throw error;
            });
        }
    }

    /**
     * determineHandlerIsRequired - function for deciding if handler should be connected to AMQP.
     * @method
     * @param HandlerClass - Target handler class.
     * @author Danil Andreev
     */
    private static determineHandlerIsRequired(HandlerClass: typeof AmqpHandler): boolean {
        const type: string = Reflect.getMetadata("amqp-handler-type", HandlerClass);
        if (
            SystemConfig.getConfig<Config>().system.commandsEventHandlers &&
            (type === "commands-event-handler" || type === "telegram-events-handler")
        )
            return true;
        if (SystemConfig.getConfig<Config>().system.drawEventsHandlers && type === "draw-event-handler") return true;
        if (SystemConfig.getConfig<Config>().system.githubEventsHandlers && type === "github-event-handler")
            return true;
        return false;
    }

    /**
     * hook - method for connecting handlers to AMQP queues.
     * @method
     * @param handler - instance of handler class.
     * @author Danil Andreev
     */
    public async hook(handler: AmqpHandler) {
        const queueName = Reflect.getMetadata("amqp-handler-queue", handler);
        const prefetch = Reflect.getMetadata("amqp-handler-prefetch", handler);
        if (typeof queueName !== "string")
            throw new TypeError(
                `Invalid handler. You have to inherit your handler from AmqpHandler and decorate it with AmqpHandler.Handler decorator.`
            );
        const channel: Amqp.Channel = await this.connection.createChannel();
        await channel.assertQueue(queueName);
        await channel.prefetch(prefetch || 10);
        await channel.consume(queueName, msg => {
            this.metricsActive++;
            if (msg) handler.execute(msg, channel);
        });
        Logger.silly(`Hooked AMQP handler to queue: "${queueName}"`);
    }

    /**
     * sendToQueue - method, designed to queue message.
     * @param queueName - Target AMQP queue name.
     * @param message  - JSON object to send.
     * @param options - Send options.
     */
    public async sendToQueue<T extends JSONObject>(queueName: string, message: T, options?: Amqp.Options.Publish) {
        Logger.debug(`Sent message to AMQP queue: "${queueName}".`);
        const channel: Amqp.Channel = await this.connection.createChannel();
        await channel.assertQueue(queueName);
        channel.sendToQueue(queueName, Buffer.from(JSON.stringify(message)), options);
        await channel.close();
    }

    /**
     * init - initializes AmqpDispatcher.
     * @constructor
     * @author Danil Andreev
     */
    public static async init(): Promise<AmqpDispatcher> {
        // await this.getCurrent().destruct();
        try {
            Logger.debug(`Initialized AMQP dispatcher.`);
            const connection: Connection = await Amqp.connect(SystemConfig.getConfig<Config>().amqp.connect);
            AmqpDispatcher.current = new AmqpDispatcher(connection);
            return AmqpDispatcher.current;
        } catch (error) {
            throw new FatalError("Failed to connect to AMQP server:", error);
        }
    }

    /**
     * getCurrent - returns current instance of dispatcher.
     * @method
     * @author Danil Andreev
     */
    public static getCurrent(): AmqpDispatcher {
        return this.current;
    }

    /**
     * getConnection - returns AMQP connection object.
     * @method
     * @author Danil Andreev
     */
    public getConnection(): Connection {
        return this.connection;
    }

    /**
     * getMetrics - returns quantity of handled event messages.
     * @method
     * @author Danil Andreev
     */
    public getMetrics(): number | JSONObject<number> {
        return this.metricsPrev;
    }

    public release(): void {
        clearInterval(this.metricsInterval);
    }

    public async destruct(): Promise<void> {
        if (this.connection)
            await this.connection.close();
    }
}

export default AmqpDispatcher;
