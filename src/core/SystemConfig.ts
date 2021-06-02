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

import * as dotenv from "dotenv";
import JSONObject from "./interfaces/JSONObject";
import * as fs from "fs";
import * as _ from "lodash";
import createRef from "./utils/createRef";
import Ref from "./interfaces/Ref";
import root from "./utils/root";

namespace SystemConfig {
    /**
     * EnvDispatcher - type for environment dispatcher function.
     * This function should place data from ENV to right place in config.
     */
    export type EnvDispatcher = (
        configRef: Ref<JSONObject>,
        value: string | undefined,
        execArray: RegExpExecArray | null,
        regExp?: RegExp
    ) => void;

    /**
     * Options - interface for SystemConfig additional options.
     * @interface
     * @author Danil Andreev
     */
    export interface Options {
        /**
         * envFiles - array of environment file paths. Each of this files will be loaded to config.
         */
        envFiles?: string[];
        /**
         * envMask - regexp mask for environment variables filtering.
         */
        envMask?: RegExp;
        /**
         * envDispatcher - function for converting keys from ENV variable name to key inside config object.
         * @callback EnvDispatcher
         * @param value - Input value
         */
        envDispatcher?: EnvDispatcher;
        /**
         * additionalConfigs - additional config inputs.
         */
        additionalConfigs?: JSONObject[];
        /**
         * disableOptionsMerging - if true, options will be merged with default SystemConfig options.
         * @default false
         */
        disableOptionsMerging?: boolean;
    }
}

/**
 * SystemConfig - class, designed for gathering and merging system configuration from several files.
 * ### This mechanism can gather info from:
 * - SYSTEM ENVIRONMENT VARIABLES
 * - .env
 * - additionalConfig
 * - config.json
 *
 * > Note, list items ordered by priority.
 *
 * @class
 * @author Danil Andreev
 */
class SystemConfig<T extends JSONObject> {
    /**
     * options - SystemConfig options.
     */
    protected static options: SystemConfig.Options = {
        envFiles: [
            root + "/../.env",
            root + "/../.env.production",
            root + "/../.env.development",
            root + "/../.env.local",
        ],
        envMask: /(.+)/
    };
    protected static current: SystemConfig<JSONObject>;

    /**
     * config - full system configuration object.
     */
    public config: T = {} as T;

    /**
     * Initializes the config field of the class by gathering info from all places.
     * @constructor
     * @author Danil Andreev
     */
    constructor() {
        // Merging additional configs to common config
        if (SystemConfig.options?.additionalConfigs) {
            for (const config of SystemConfig.options.additionalConfigs) {
                if (typeof config === "object") {
                    _.merge(this.config, config);
                } else {
                    console.warn(`Invalid type of 'additionalConfig' item, expected "object", got "${typeof config}"`);
                }
            }
        }

        try {
            const configJson: JSONObject = JSON.parse(fs.readFileSync("./../config.json").toString());
            _.merge(this.config, configJson);
        } catch (error) {
            if (error.code !== "ENOENT")
                console.warn(`Unable to load configuration from "config.json" file.`, error.method, error.stack);
        }

        SystemConfig.loadEnv();

        // Merging ENV variables to config
        const regExp: RegExp | undefined = SystemConfig.options?.envMask;
        const configRef: Ref<JSONObject> = createRef(this.config);
        for (const key in process.env) {
            if (!regExp || regExp.test(key)) {
                const execArray: RegExpExecArray | null = regExp ? regExp.exec(key) : null;
                if (execArray === null) continue;
                const envDispatcher: SystemConfig.EnvDispatcher =
                    SystemConfig.options?.envDispatcher || SystemConfig.defaultEnvDispatcher;
                envDispatcher(configRef, process.env[key], execArray, regExp);
            }
        }
        _.merge(this.config, configRef.current);
    }

    /**
     * loadEnv - loads variables from files to process env.
     * @method
     * @author Danil Andreev
     */
    public static loadEnv(): JSONObject<string> {
        const env: JSONObject<string> = {};

        const paths: string[] = SystemConfig.options?.envFiles || [];
        if (!paths) return env;

        for (const pathname of paths) {
            try {
                const tempEnv: JSONObject<string> = dotenv.parse(fs.readFileSync(pathname).toString());
                _.merge(env, tempEnv);
            } catch (error) {
                if (error.code === "ENOENT")
                    console.warn(`Could not find env file "${pathname}", skipping`);
                else console.warn(error.message, error.stack);
            }
        }

        const prevEnv = process.env;
        _.merge(env, prevEnv);
        process.env = env;

        return env;
    }

    /**
     * defaultEnvDispatcher - default environment variables dispatcher.
     * By default it will place to config root values with ENV variable name as key.
     * @method
     * @param configRef - Reference for config object.
     * @param value - Value derived from ENV.
     * @param execArray - RegExp exec array.
     * @param regExp - regular expression.
     * @author Danil Andreev
     */
    public static defaultEnvDispatcher(
        configRef: Ref<JSONObject>,
        value: string,
        execArray: RegExpExecArray,
        regExp: RegExp
    ): void {
        configRef.current[execArray.input] = value;
    }

    /**
     * getCurrent - returns current instance of SystemConfig class.
     * If it hasn't been initialized yet new reference will be created.
     * @method
     * @author Danil Andreev
     */
    public static getCurrent<E>(): SystemConfig<E> {
        if (!this.current) {
            this.current = new SystemConfig<E>();
        }
        return this.current as SystemConfig<E>;
    }

    public static getConfig<E extends JSONObject = JSONObject>(): E {
        return this.getCurrent<E>().config;
    }

    /**
     * setOptions - setter for class options.
     * @param options - Gathering options.
     * @author Danil Andreev
     */
    public static setOptions(options: SystemConfig.Options): typeof SystemConfig {
        if (options) {
            if (options.disableOptionsMerging) this.options = options;
            else _.merge(this.options, options);
        }
        return this;
    }
}

export default SystemConfig;
