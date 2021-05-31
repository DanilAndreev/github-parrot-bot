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

import JSONObject from "../interfaces/JSONObject";

/**
 * HttpError - class for HTTP exchange error.
 * @class
 * @author Danil Andreev
 */
class HttpError extends Error {
    /**
     * code - HTTP response code.
     * @default 500
     */
    public readonly code: number;
    /**
     * data - JSON response data.
     */
    protected data: JSONObject;

    /**
     * Creates an instance of HttpError.
     * @constructor
     * @param message - HTTP response message.
     * @author Danil Andreev
     */
    constructor(message: string);
    /**
     * Creates an instance of HttpError.
     * @constructor
     * @param code - HTTP response code.
     * @author Danil Andreev
     */
    constructor(code: number);
    /**
     * Creates an instance of HttpError.
     * @constructor
     * @param message - HTTP response message.
     * @param code - HTTP response code.
     * @author Danil Andreev
     */
    constructor(message: string | number, code: number);
    constructor(message: string | number, code: number = 500) {
        if (typeof message === "number") {
            code = message;
            message = "";
        }
        super(message);
        this.code = code;
    }

    /**
     * setData - sets error data. Once data set - getResponseMessage() will return an JSON object.
     * @method
     * @param data - JSON data.
     * @author Danil Andreev
     */
    public setData(data: JSONObject): HttpError {
        this.data = data;
        return this;
    }

    /**
     * getResponseMessage - returns response message for HTTP exchange.
     * @method
     * @author Danil Andreev
     */
    public getResponseMessage(): string | JSONObject {
        if (this.data)
            return {message: this.message, code: this.code, ...this.data};
        return `Error: ${this.code}. ${this.message}`;
    }
}

export default HttpError;
