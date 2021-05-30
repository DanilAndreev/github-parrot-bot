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

import type {BaseEntity} from "typeorm";
import type JSONObject from "../../../src/core/interfaces/JSONObject";
import type {Context} from "koa";
import WebHookAmqpHandler from "../../../src/core/amqp/WebHookAmqpHandler";
import {createHmac} from "crypto";
import {mocked} from "ts-jest/utils";
import * as typeorm from "typeorm";

jest.mock("typeorm");

class TestWebHookAmqpHandler extends WebHookAmqpHandler {
    public callback: Function;

    constructor(callback: Function) {
        super();
        this.callback = callback;
    }

    protected async handleHook(): Promise<boolean | void> {
        return this.callback();
    }
}

describe("core->amqp->WebHookAmqpHandler", () => {
    let payload: JSONObject;
    let ctx: Context;

    beforeAll(() => {
        jest.clearAllMocks();
    });

    beforeEach(() => {
        payload = {
            repository: {
                full_name: "test-repository",
            }
        }
        ctx = {
            request: {
                header: {
                    "x-hub-signature": "sha1=" + createHmac("sha1", "aaa").update(JSON.stringify(payload)).digest("hex"),
                }
            }
        } as Context;
    });

    test("Repository connected to one chat.", async () => {
        const callback = jest.fn();
        const handler: any = new TestWebHookAmqpHandler(callback);
        mocked(typeorm.BaseEntity).find.mockResolvedValueOnce([{secret: "aaa"} as unknown as BaseEntity]);
        await expect(handler.handle({payload, ctx}, {})).resolves.not.toThrowError();
        expect(callback).toBeCalledTimes(1);
    });

    test("Repository connected to several chats with same secret.", async () => {
        const callback = jest.fn();
        const handler: any = new TestWebHookAmqpHandler(callback);
        mocked(typeorm.BaseEntity).find.mockResolvedValueOnce([
            {secret: "aaa"} as unknown as BaseEntity,
            {secret: "aaa"} as unknown as BaseEntity,
            {secret: "aaa"} as unknown as BaseEntity,
        ]);
        await expect(handler.handle({payload, ctx}, {})).resolves.not.toThrowError();
        expect(callback).toBeCalledTimes(3);
    });

    test("Repository connected to several chats with different secret.", async () => {
        const callback = jest.fn();
        const handler: any = new TestWebHookAmqpHandler(callback);
        mocked(typeorm.BaseEntity).find.mockResolvedValueOnce([
            {secret: "aaa"} as unknown as BaseEntity,
            {secret: "bbb"} as unknown as BaseEntity,
            {secret: "aaa"} as unknown as BaseEntity,
        ]);
        await expect(handler.handle({payload, ctx}, {})).resolves.not.toThrowError();
        expect(callback).toBeCalledTimes(2);
    });

    test("Repository connected to 3 chats. Second handler throws error.", async () => {
        const callback = jest.fn()
            .mockImplementationOnce(() => undefined)
            .mockImplementationOnce(() => {throw new Error()})
            .mockImplementationOnce(() => undefined);

        const handler: any = new TestWebHookAmqpHandler(callback);
        mocked(typeorm.BaseEntity).find.mockResolvedValueOnce([
            {secret: "aaa"} as unknown as BaseEntity,
            {secret: "aaa"} as unknown as BaseEntity,
            {secret: "aaa"} as unknown as BaseEntity,
        ]);
        await expect(handler.handle({payload, ctx}, {})).rejects.toThrowError(Error);
        expect(callback).toBeCalledTimes(3);
    });
});
