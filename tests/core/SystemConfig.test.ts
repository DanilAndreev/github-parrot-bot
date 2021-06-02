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

import type Ref from "../../src/core/interfaces/Ref";
import SystemConfig from "../../src/core/SystemConfig";
import * as fs from "fs";
import {mocked} from "ts-jest/utils";
import SpyInstance = jest.SpyInstance;

jest.mock("fs")

describe("core->SystemConfig", () => {
    function envDispatcher(
        configRef: Ref<any>,
        value: string,
        execArray: RegExpExecArray,
        regExp: RegExp
    ): void {
        const name: string = execArray[1].toLowerCase();
        switch (name) {
            case "env1":
                configRef.current.environment1 = value;
                break;
            case "env2":
                configRef.current.environment2 = value;
                break;
            default:
                break;
        }
    }

    let tempEnv: any;
    let tempOptions: SystemConfig.Options;
    let consoleSpy: SpyInstance;

    beforeAll(() => {
        tempEnv = process.env;
        tempOptions = (SystemConfig as any).options;
        consoleSpy = jest.spyOn(global.console, "warn").mockImplementation(jest.fn());
    });

    afterAll(() => {
        process.env = tempEnv;
        (SystemConfig as any).options = tempOptions;
    });

    beforeEach(() => {
        process.env = tempEnv;
        (SystemConfig as any).options = tempOptions;
        mocked(fs).readFileSync.mockReturnValue(Buffer.from(""));
    });

    test("Constructs without errors.", () => {
        mocked(fs).readFileSync.mockReturnValueOnce(Buffer.from("{}"));
        expect(() => new SystemConfig<any>()).not.toThrowError();
    });

    test("Test loading from '.env' file.", () => {
        mocked(fs).readFileSync.mockReturnValueOnce(Buffer.from("{}"));
        mocked(fs).readFileSync.mockReturnValueOnce(Buffer.from("ENV1=hello\nENV2=darkness"));
        SystemConfig.setOptions({
            envDispatcher,
        })
        const config = new SystemConfig<any>();
        expect(config.config.environment1).toEqual("hello");
        expect(config.config.environment2).toEqual("darkness");
    });

    test("Test merging info from ENV and '.env' and 'config.json' files.", () => {
        mocked(fs).readFileSync.mockReturnValueOnce(Buffer.from(`{"environment3": "my", "environment4": "old"}`));
        mocked(fs).readFileSync.mockReturnValueOnce(Buffer.from("ENV1=hello\nENV2=darkness"));
        SystemConfig.setOptions({
            envDispatcher,
            additionalConfigs: [{
                environment1: "friend",
                environment3: "foo",
            }]
        })
        const config = new SystemConfig<any>();
        expect(config.config.environment1).toEqual("hello");
        expect(config.config.environment2).toEqual("darkness");
        expect(config.config.environment3).toEqual("my");
        expect(config.config.environment4).toEqual("old");
    });

    test("Constructs when some of '.env' files are missing.", () => {
        mocked(fs).readFileSync.mockReturnValueOnce(Buffer.from("{}"));
        mocked(fs).readFileSync.mockImplementationOnce(() => {
            const error: any = new Error("File not found");
            error.code = "ENOENT";
            throw error;
        });
        expect(() => new SystemConfig<any>()).not.toThrowError();
        expect(consoleSpy).toBeCalledTimes(1);
    });

    test("Constructs when all of '.env' and 'config.json' files are missing.", () => {
        mocked(fs).readFileSync.mockImplementation(() => {
            const error: any = new Error("File not found");
            error.code = "ENOENT";
            throw error;
        });
        expect(() => new SystemConfig<any>()).not.toThrowError();
        expect(consoleSpy).toBeCalledTimes(5);
    });

    test("GetConfig singleton method creates instance if it wasn't created.", () => {
        (SystemConfig as any).current = undefined;
        expect(() => SystemConfig.getConfig()).not.toThrowError();
        expect((SystemConfig as any).current).toBeDefined();
    });
});
