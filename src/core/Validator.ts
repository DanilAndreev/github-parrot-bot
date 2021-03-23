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

import Ajv, {JSONSchemaType, ValidateFunction} from "ajv";
import ValidationError from "../errors/ValidationError";


export default class Validator<T> {
    /**
     * AJV instance for validation.
     */
    protected static ajv = new Ajv({allErrors: true});
    protected validator: ValidateFunction;
    public readonly requires: string[];
    public readonly key: string;
    public readonly required: boolean;

    constructor(key: string, schema: JSONSchemaType<T>, required: boolean = true, requires?: string[]) {
        this.validator = Validator.ajv.compile<T>(schema);
        this.requires = requires || [];
        this.key = key;
        this.required = required;
    }

    public validate(data: any): any {
        if (!this.validator)
            throw new ReferenceError("Validator is undefined.");
        if(!this.validator(data)) {
            if (this.validator.errors)
                throw new ValidationError("Argument " + this.key + " " + this.validator.errors.map(item => item.message).join("\n"));
            else
                throw new ValidationError("Invalid arguments.");
        }
        return data;
    }
}
