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

//TODO: fix problems with describes.
describe("core->amqp->CallbacksQueryDispatcher", () => {
    describe("Exact=false", () => {
        class TestCallbacksDispatcher {
            public static callback: Function;

            @CallbackQueryDispatcher.CallbackQueryHandler("dispatcher1.handler1")
            public static handler1(query: CallbackQuery, params: JSONObject<{id: string}>) {
                this.callback(query, params);
            }

            @CallbackQueryDispatcher.CallbackQueryHandler("dispatcher1")
            public static handler2(query: CallbackQuery, params: JSONObject<{id: string}>) {
                this.callback(query, params);
            }
        }

        let config: Config;

        beforeEach(() => {
            config = ({bot: {callbackQueryHandlers: []}} as unknown) as Config;
        });

        beforeAll(() => {
            jest.clearAllMocks();
        });

        test("Test path that longer than one of the handlers.", () => {
            const callback = jest.fn();
            TestCallbacksDispatcher.callback = callback;
            config.bot.callbackQueryHandlers = [TestCallbacksDispatcher];
            mocked(SystemConfig.getConfig).mockReturnValue(config);
            const dispatcher: any = new CallbackQueryDispatcher();
            const query: CallbackQuery = {data: "dispatcher1.handler1"} as CallbackQuery;
            expect(dispatcher.handleCallbackQuery(query)).resolves.not.toThrowError();
            expect(callback).toBeCalledTimes(2);
        });

        test("Test path that longer than bot handlers.", () => {
            const callback = jest.fn();
            TestCallbacksDispatcher.callback = callback;
            config.bot.callbackQueryHandlers = [TestCallbacksDispatcher];
            mocked(SystemConfig.getConfig).mockReturnValue(config);
            const dispatcher: any = new CallbackQueryDispatcher();
            const query: CallbackQuery = {data: "dispatcher1.handler1.trail"} as CallbackQuery;
            expect(dispatcher.handleCallbackQuery(query)).resolves.not.toThrowError();
            expect(callback).toBeCalledTimes(2);
        });

        test("Test path that shorter than bot handlers.", () => {
            const callback = jest.fn();
            TestCallbacksDispatcher.callback = callback;
            config.bot.callbackQueryHandlers = [TestCallbacksDispatcher];
            mocked(SystemConfig.getConfig).mockReturnValue(config);
            const dispatcher: any = new CallbackQueryDispatcher();
            const query: CallbackQuery = {data: "dispatcher1"} as CallbackQuery;
            expect(dispatcher.handleCallbackQuery(query)).resolves.not.toThrowError();
            expect(callback).toBeCalledTimes(1);
        });
    });

    describe("Exact=true", () => {
        class TestCallbacksDispatcher {
            public static callback: Function;

            @CallbackQueryDispatcher.CallbackQueryHandler("dispatcher1.handler1", {exact: true})
            public static handler1(query: CallbackQuery, params: JSONObject<{id: string}>) {
                this.callback(query, params);
            }

            @CallbackQueryDispatcher.CallbackQueryHandler("dispatcher1", {exact: true})
            public static handler2(query: CallbackQuery, params: JSONObject<{id: string}>) {
                this.callback(query, params);
            }
        }

        let config: Config;

        beforeAll(() => {
            jest.clearAllMocks();
        });

        beforeEach(() => {
            config = ({bot: {callbackQueryHandlers: []}} as unknown) as Config;
        });

        test("Test path that longer than one of the handlers. (exact=true)", () => {
            const callback = jest.fn();
            TestCallbacksDispatcher.callback = callback;
            config.bot.callbackQueryHandlers = [TestCallbacksDispatcher];
            mocked(SystemConfig.getConfig).mockReturnValue(config);
            const dispatcher: any = new CallbackQueryDispatcher();
            const query: CallbackQuery = {data: "dispatcher1.handler1"} as CallbackQuery;
            expect(dispatcher.handleCallbackQuery(query)).resolves.not.toThrowError();
            expect(callback).toBeCalledTimes(1);
        });

        test("Test path that longer than bot handlers. (exact=true)", () => {
            const callback = jest.fn();
            TestCallbacksDispatcher.callback = callback;
            config.bot.callbackQueryHandlers = [TestCallbacksDispatcher];
            mocked(SystemConfig.getConfig).mockReturnValue(config);
            const dispatcher: any = new CallbackQueryDispatcher();
            const query: CallbackQuery = {data: "dispatcher1.handler1.trail"} as CallbackQuery;
            expect(dispatcher.handleCallbackQuery(query)).resolves.not.toThrowError();
            expect(callback).not.toBeCalled();
        });

        test("Test path that shorter than bot handlers. (exact=true)", () => {
            const callback = jest.fn();
            TestCallbacksDispatcher.callback = callback;
            config.bot.callbackQueryHandlers = [TestCallbacksDispatcher];
            mocked(SystemConfig.getConfig).mockReturnValue(config);
            const dispatcher: any = new CallbackQueryDispatcher();
            const query: CallbackQuery = {data: "dispatcher1"} as CallbackQuery;
            expect(dispatcher.handleCallbackQuery(query)).resolves.not.toThrowError();
            expect(callback).toBeCalledTimes(1);
        });
    });
});
