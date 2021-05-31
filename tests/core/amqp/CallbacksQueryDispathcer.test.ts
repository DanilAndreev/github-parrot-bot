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

import type Config from "../../../src/interfaces/Config";
import type {CallbackQuery, User} from "node-telegram-bot-api";
import type JSONObject from "../../../src/core/interfaces/JSONObject";
import SystemConfig from "../../../src/core/SystemConfig";
import {mocked} from "ts-jest/utils";
import CallbackQueryDispatcher from "../../../src/core/amqp/CallbackQueryDispatcher";

jest.mock("../../../src/core/SystemConfig");

describe("core->amqp->CallbacksQueryDispatcher", () => {
    describe("Pattern with exact=false", () => {
        class TestCallbacksDispatcher {
            public static callback: Function;

            @CallbackQueryDispatcher.CallbackQueryHandler("dispatcher.handler1")
            public static handler1(query: CallbackQuery, params: JSONObject<{ id: string }>) {
                this.callback(query, params);
            }

            @CallbackQueryDispatcher.CallbackQueryHandler("dispatcher")
            public static handler2(query: CallbackQuery, params: JSONObject<{ id: string }>) {
                this.callback(query, params);
            }
        }

        let config: Config;
        let dispatcher: any;

        beforeAll(() => {
            jest.clearAllMocks();
        });

        beforeEach(() => {
            TestCallbacksDispatcher.callback = jest.fn();
            config = ({bot: {callbackQueryHandlers: [TestCallbacksDispatcher]}} as unknown) as Config;
            mocked(SystemConfig.getConfig).mockReturnValue(config);
            dispatcher = new CallbackQueryDispatcher();
        });

        test("Test path that longer than one of the handlers.", async () => {
            const query: CallbackQuery = {data: "dispatcher.handler1"} as CallbackQuery;
            await expect(dispatcher.handleCallbackQuery(query)).resolves.not.toThrowError();
            expect(TestCallbacksDispatcher.callback).toBeCalledTimes(2);
        });

        test("Test path that longer than bot handlers.", async () => {
            const query: CallbackQuery = {data: "dispatcher.handler1.trail"} as CallbackQuery;
            await expect(dispatcher.handleCallbackQuery(query)).resolves.not.toThrowError();
            expect(TestCallbacksDispatcher.callback).toBeCalledTimes(2);
        });

        test("Test path that shorter than bot handlers.", async () => {
            const query: CallbackQuery = {data: "dispatcher"} as CallbackQuery;
            await expect(dispatcher.handleCallbackQuery(query)).resolves.not.toThrowError();
            expect(TestCallbacksDispatcher.callback).toBeCalledTimes(1);
        });
    });

    describe("Pattern with exact=true", () => {
        class TestCallbacksDispatcher {
            public static callback: Function;

            @CallbackQueryDispatcher.CallbackQueryHandler("dispatcher.handler1", {exact: true})
            public static handler1(query: CallbackQuery, params: JSONObject<{ id: string }>) {
                this.callback(query, params);
            }

            @CallbackQueryDispatcher.CallbackQueryHandler("dispatcher", {exact: true})
            public static handler2(query: CallbackQuery, params: JSONObject<{ id: string }>) {
                this.callback(query, params);
            }
        }

        let config: Config;
        let dispatcher: any;

        beforeAll(() => {
            jest.clearAllMocks();
        });

        beforeEach(() => {
            TestCallbacksDispatcher.callback = jest.fn();
            config = ({bot: {callbackQueryHandlers: [TestCallbacksDispatcher]}} as unknown) as Config;
            mocked(SystemConfig.getConfig).mockReturnValue(config);
            dispatcher = new CallbackQueryDispatcher();
        });

        test("Test path that longer than one of the handlers.", async () => {
            const query: CallbackQuery = {data: "dispatcher.handler1"} as CallbackQuery;
            await expect(dispatcher.handleCallbackQuery(query)).resolves.not.toThrowError();
            expect(TestCallbacksDispatcher.callback).toBeCalledTimes(1);
        });

        test("Test path that longer than bot handlers.", async () => {
            const query: CallbackQuery = {data: "dispatcher.handler1.trail"} as CallbackQuery;
            await expect(dispatcher.handleCallbackQuery(query)).resolves.not.toThrowError();
            expect(TestCallbacksDispatcher.callback).not.toBeCalled();
        });

        test("Test path that shorter than bot handlers.", async () => {
            const query: CallbackQuery = {data: "dispatcher"} as CallbackQuery;
            await expect(dispatcher.handleCallbackQuery(query)).resolves.not.toThrowError();
            expect(TestCallbacksDispatcher.callback).toBeCalledTimes(1);
        });
    });

    describe("Pattern with arguments", () => {
        class TestCallbacksDispatcher {
            public static callback1: Function;
            public static callback2: Function;
            public static callback3: Function;
            public static callback4: Function;

            @CallbackQueryDispatcher.CallbackQueryHandler("dispatcher.:handler")
            public static handler1(query: CallbackQuery, params: JSONObject<{ id: string }>) {
                this.callback1(query, params);
            }

            @CallbackQueryDispatcher.CallbackQueryHandler("dispatcher")
            public static handler2(query: CallbackQuery, params: JSONObject<{ id: string }>) {
                this.callback2(query, params);
            }

            @CallbackQueryDispatcher.CallbackQueryHandler("dispatcher.:handler.:argument")
            public static handler3(query: CallbackQuery, params: JSONObject<{ id: string }>) {
                this.callback3(query, params);
            }

            @CallbackQueryDispatcher.CallbackQueryHandler("dispatcher.:handler.path")
            public static handler4(query: CallbackQuery, params: JSONObject<{ id: string }>) {
                this.callback4(query, params);
            }
        }

        let config: Config;
        let dispatcher: any;

        beforeAll(() => {
            jest.clearAllMocks();
        });

        beforeEach(() => {
            TestCallbacksDispatcher.callback1 = jest.fn();
            TestCallbacksDispatcher.callback2 = jest.fn();
            TestCallbacksDispatcher.callback3 = jest.fn();
            TestCallbacksDispatcher.callback4 = jest.fn();
            config = ({bot: {callbackQueryHandlers: [TestCallbacksDispatcher]}} as unknown) as Config;
            mocked(SystemConfig.getConfig).mockReturnValue(config);
            dispatcher = new CallbackQueryDispatcher();
        });

        test("Test arguments are passed to handler.", async () => {
            const query: CallbackQuery = {data: "dispatcher.handler"} as CallbackQuery;
            await expect(dispatcher.handleCallbackQuery(query)).resolves.not.toThrowError();
            expect(TestCallbacksDispatcher.callback1).toBeCalledTimes(1);
            expect(TestCallbacksDispatcher.callback1).toBeCalledWith(query, {handler: "handler"})
            expect(TestCallbacksDispatcher.callback2).toBeCalledTimes(1);
            expect(TestCallbacksDispatcher.callback2).toBeCalledWith(query, {});
            expect(TestCallbacksDispatcher.callback3).not.toBeCalled();
            expect(TestCallbacksDispatcher.callback4).not.toBeCalled();
        });

        test("Test static and param fields in different handlers on the same position.", async () => {
            const query: CallbackQuery = {data: "dispatcher.handler.path"} as CallbackQuery;
            await expect(dispatcher.handleCallbackQuery(query)).resolves.not.toThrowError();
            expect(TestCallbacksDispatcher.callback1).toBeCalledTimes(1);
            expect(TestCallbacksDispatcher.callback1).toBeCalledWith(query, {handler: "handler"})
            expect(TestCallbacksDispatcher.callback2).toBeCalledTimes(1);
            expect(TestCallbacksDispatcher.callback2).toBeCalledWith(query, {})
            expect(TestCallbacksDispatcher.callback3).toBeCalledTimes(1);
            expect(TestCallbacksDispatcher.callback3).toBeCalledWith(query, {handler: "handler", argument: "path"})
            expect(TestCallbacksDispatcher.callback4).toBeCalledTimes(1);
            expect(TestCallbacksDispatcher.callback4).toBeCalledWith(query, {handler: "handler"})
        });
    });
});
