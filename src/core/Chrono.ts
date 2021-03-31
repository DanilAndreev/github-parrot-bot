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

/**
 * Chrono - class for implementing chron functional.
 * @class
 * @abstract
 * @author Danil Andreev
 * @example
 * class MyChrono extends Chrono {
 *     protected run(name: string) {
 *         console.log(`Hello ${name} from chron function.`);
 *     }
 * }
 * const cron: Chrono = new MyChrono().start();
 */
abstract class Chrono {
    /**
     * chronHandle - JS setInterval() handle.
     */
    public chronHandle;
    /**
     * options - Chrono execution settings.
     */
    protected options;

    /**
     * @method
     * @abstract
     * @param args - Any args you need in your function.
     * @author Danil Andreev
     */
    protected abstract run(...args: any[]): void | Promise<void>;

    /**
     * Creates an instance of Chrono.
     * @constructor
     * @param options - Chrono options.
     * @author Danil Andreev
     */
    constructor(options: Chrono.Options = {}) {
        this.options = options;
    }

    /**
     * beforeLaunch - function, which will be called before interval loop launch.
     * Override it to add functional.
     * @method
     * @abstract
     * @author Danil Andreev
     */
    protected beforeLaunch(): void | Promise<void> {
    }

    /**
     * start - starts the chron function.
     * @method
     * @param args - Chrono function arguments.
     * @author Danil Andreev.
     */
    public async start(...args: any[]): Promise<Chrono> {
        const {
            interval = 1000,
            noInstantRun = false,
        } = this.options;
        await this.beforeLaunch();
        if (!noInstantRun) this.run();
        this.chronHandle = setInterval(this.run, interval, arguments);
        return this;
    }

    /**
     * stop - stops executing chron function.
     * @method
     * @author Danil Andreev
     */
    public stop(): void {
        clearInterval(this.chronHandle);
    }
}

namespace Chrono {
    export interface Options {
        /**
         * interval - interval time in milliseconds.
         * @default 1000
         */
        interval?: number;
        /**
         * noInstantRun - if true, cron func will be called first time after interval delay.
         * @default false
         */
        noInstantRun?: boolean;
    }
}

export default Chrono;
