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

import Chrono from "../../src/core/Chrono";

jest.useFakeTimers();

class ChronoDerived extends Chrono {
    protected callback: Function;

    constructor(opts: Chrono.Options, callback: Function) {
        super(opts);
        this.callback = callback;
    }

    protected run(...args: any[]): void | Promise<void> {
        this.callback();
    }
}

describe("core->Chrono", () => {
    afterEach(() => {
        jest.clearAllTimers();
    })

    test("Interval with instant running.", async () => {
        const callback = jest.fn();
        const chrono = new ChronoDerived({interval: 10}, callback);
        expect(callback).not.toBeCalled();
        await chrono.start();
        jest.advanceTimersByTime(100);
        expect(callback).toBeCalledTimes(11);
    });

    test("Interval without instant running.", async () => {
        const callback = jest.fn();
        const chrono = new ChronoDerived({interval: 10, noInstantRun: true}, callback);
        expect(callback).not.toBeCalled();
        await chrono.start();
        jest.advanceTimersByTime(100);
        expect(callback).toBeCalledTimes(10);
    });

    test("Interval stops on destroy.", async () => {
        const callback = jest.fn();
        const chrono = new ChronoDerived({interval: 10, noInstantRun: true}, callback);
        await chrono.start();
        jest.advanceTimersByTime(100);
        expect(callback).toBeCalledTimes(10);
        chrono.destruct();
        jest.advanceTimersByTime(100);
        expect(callback).toBeCalledTimes(10);
    });
});
