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

import BotCommand from "../../../src/core/bot/BotCommand";
import {Message} from "node-telegram-bot-api";
import JSONObject from "../../../src/core/interfaces/JSONObject";
import CommandError from "../../../src/errors/CommandError";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const AmqpEventModule = require("../../../src/core/amqp/AmqpEvent");

jest.mock("../../../src/core/amqp/AmqpEvent");
jest.mock("../../../src/core/logger/Logger");

@BotCommand.Command("test", "<param1> <param2>")
class TestBotCommand extends BotCommand {
    public callback: Function;

    constructor(callback: Function) {
        super();
        this.callback = callback;
    }

    protected async handler(message: Message, args: string[], opts: JSONObject<string>): Promise<void> {
        this.callback();
    }
}

@BotCommand.Command("test", "<param1> <param2> [param3]")
class TestBotCommandWithOptionalArgs extends TestBotCommand {}

let message: Message;

//TODO: add tests for all decorators.

describe("core->bot->BotCommand", () => {
    beforeEach(() => {
        message = {
            chat: {
                id: 100,
                type: "group",
            },
            message_id: 10,
            date: 0,
        };
        AmqpEventModule.clearQueues();
    });

    test("Basic execution.", async () => {
        const callback = jest.fn();
        const command = new TestBotCommand(callback);
        await expect(command.execute(message, ["", "", "param1 param2"] as RegExpExecArray)).resolves.not.toThrow();
        expect(callback).toBeCalledTimes(1);
    });

    test("Not enough parameters | 2 required and 0 optional.", async () => {
        const callback = jest.fn();
        const command = new TestBotCommand(callback);
        await expect(command.execute(message, ["", "", "param1"] as RegExpExecArray)).resolves.not.toThrow();
        expect(callback).toBeCalledTimes(0);
        expect(AmqpEventModule.queues["messages"]).toBeTruthy();
        expect(AmqpEventModule.queues["messages"].length).toEqual(1);
        const event = AmqpEventModule.queues["messages"][0];
        expect(event.data?.type).toEqual("send-chat-message");
        expect(event.data?.text).toContain("missing required argument");
    });

    test("To many parameters | 2 required and 0 optional.", async () => {
        const callback = jest.fn();
        const command = new TestBotCommand(callback);
        await expect(
            command.execute(message, ["", "", "param1 param2, param3"] as RegExpExecArray)
        ).resolves.not.toThrow();
        expect(callback).toBeCalledTimes(0);
        expect(AmqpEventModule.queues["messages"]).toBeTruthy();
        expect(AmqpEventModule.queues["messages"].length).toEqual(1);
        const event = AmqpEventModule.queues["messages"][0];
        expect(event.data?.type).toEqual("send-chat-message");
        expect(event.data?.text).toContain("too many arguments");
    });

    test("Regular execution | 2 required and 1 optional.", async () => {
        const callback = jest.fn();
        const command = new TestBotCommandWithOptionalArgs(callback);
        await expect(
            command.execute(message, ["", "", "param1 param2 param3"] as RegExpExecArray)
        ).resolves.not.toThrow();
        expect(callback).toBeCalledTimes(1);
        await expect(command.execute(message, ["", "", "param1 param2"] as RegExpExecArray)).resolves.not.toThrow();
        expect(callback).toBeCalledTimes(2);
    });

    test("Too many arguments | 2 required and 1 optional.", async () => {
        const callback = jest.fn();
        const command = new TestBotCommandWithOptionalArgs(callback);
        await expect(
            command.execute(message, ["", "", "param1 param2 param3 param4"] as RegExpExecArray)
        ).resolves.not.toThrow();
        expect(callback).toBeCalledTimes(0);
        expect(AmqpEventModule.queues["messages"]).toBeTruthy();
        expect(AmqpEventModule.queues["messages"].length).toEqual(1);
        const event = AmqpEventModule.queues["messages"][0];
        expect(event.data?.type).toEqual("send-chat-message");
        expect(event.data?.text).toContain("too many arguments");
    });

    test("Not enough arguments | 2 required and 1 optional.", async () => {
        const callback = jest.fn();
        const command = new TestBotCommandWithOptionalArgs(callback);
        await expect(command.execute(message, ["", "", "param1"] as RegExpExecArray)).resolves.not.toThrow();
        expect(callback).toBeCalledTimes(0);
        expect(AmqpEventModule.queues["messages"]).toBeTruthy();
        expect(AmqpEventModule.queues["messages"].length).toEqual(1);
        const event = AmqpEventModule.queues["messages"][0];
        expect(event.data?.type).toEqual("send-chat-message");
        expect(event.data?.text).toContain("missing required argument");
    });

    test("Execution with unrecognized error.", async () => {
        const callback = jest.fn(() => {
            throw new Error("Test error");
        });
        const command = new TestBotCommand(callback);
        await expect(command.execute(message, ["", "", "param1 param2"] as RegExpExecArray)).resolves.not.toThrow();
        expect(callback).toBeCalledTimes(1);
        expect(AmqpEventModule.queues["messages"]).toBeTruthy();
        expect(AmqpEventModule.queues["messages"].length).toEqual(1);
        const event = AmqpEventModule.queues["messages"][0];
        expect(event.data?.type).toEqual("send-chat-message");
        expect(event.data?.text).toEqual("Unrecognized error");
    });

    test("Execution with bot command error.", async () => {
        const callback = jest.fn(() => {
            throw new CommandError("Test command error");
        });
        const command = new TestBotCommand(callback);
        await expect(command.execute(message, ["", "", "param1 param2"] as RegExpExecArray)).resolves.not.toThrow();
        expect(callback).toBeCalledTimes(1);
        expect(AmqpEventModule.queues["messages"]).toBeTruthy();
        expect(AmqpEventModule.queues["messages"].length).toEqual(1);
        const event = AmqpEventModule.queues["messages"][0];
        expect(event.data?.type).toEqual("send-chat-message");
        expect(event.data?.text).toContain("Test command error");
    });
});
