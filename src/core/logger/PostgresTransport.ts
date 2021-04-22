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

import * as Transport from "winston-transport";
import * as PgPromise from "pg-promise";
import {IDatabase} from "pg-promise";
import JSONObject from "../../interfaces/JSONObject";

/**
 * PostgresTransport - winston transport for storing logs in database.
 * @class
 * @author Danil Andreev
 */
class PostgresTransport<T = any> extends Transport {
    /**
     * db - database connection.
     */
    protected db: IDatabase<any> & any;
    /**
     * hostname - computer hostname.
     */
    protected hostname: string | null;
    /**
     * table - target table name in database.
     */
    protected table: string;

    /**
     * Creates an instance of PostgresTransport.
     * @constructor
     * @param options - Constructor options.
     * @author Danil Andreev
     */
    public constructor(options: PostgresTransport.Options<T>) {
        super(options);
        const {
            hostname = process.env.COMPUTERNAME || null,
            level = "error",
            table = "log",
            connection,
        } = options;
        this.hostname = hostname;
        this.level = level;
        this.table = table;

        try {
            if (typeof connection === "string") {
                const connect = PgPromise();
                connect.pg.defaults.ssl = {
                    rejectUnauthorized: false,
                };
                this.db = connect(connection);
            } else {
                this.db = connection;
            }
        } catch(error) {
            console.log("\x1b[31mFailed to connect to log database", error);
            this.db = null;
        }
    }

    public async log(info: JSONObject, next: Function): Promise<void> {
        const {message, level, timestamp, ...meta} = info;
        try {
            if (!this.db) return;
            if (this.level !== level) return;
            await this.db
                .query(
                    `INSERT INTO "${this.table}" ("timestamp", "level", "message", "meta", "host")
                     VALUES ($1, $2, $3, $4, $5)`,
                    [timestamp, level, message, meta, this.hostname]
                );
        } catch (error) {
            console.error("\x1b[31mFailed to log to database:", error);
        } finally {
            if (next) {
                next();
            }
        }
    }
}

namespace PostgresTransport {
    /**
     * Options - constructor options.
     * @interface
     * @author Danil Andreev
     */
    export interface Options<T = any> {
        /**
         * hostname - computer host name for debugging on distributed systems.
         */
        hostname?: string;
        /**
         * level - transport log level.
         * Each message that has log level less than this option will be stored in database.
         */
        level?: "error" | "warn" | "info" | "debug" | "silly" | string;
        /**
         * table - table name in target database.
         */
        table?: string;
        /**
         * connection - pg-promise connection to database or connection string.
         */
        connection: string | IDatabase<T>;
    }
}

export default PostgresTransport;
