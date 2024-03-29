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

import {createLogger, format, Logger as LoggerType, transports} from "winston";
import * as Transport from "winston-transport";
import * as moment from "moment";
import Config from "../../interfaces/Config";
import SystemConfig from "../SystemConfig";
import PostgresTransport from "./PostgresTransport";

export let Logger: LoggerType;

const Colors = {
    info: "\x1b[34m",
    error: "\x1b[31m",
    warn: "\x1b[33m",
    debug: "\x1b[32m",
    silly: "\x1b[36m",
};

/**
 * initLogger - creates logger.
 * @function
 * @author Danil Andreev
 */
export function initLogger(): LoggerType {
    const logLevel: string = SystemConfig.getConfig<Config>().log.logLevel || "error";

    const logFormat = format.printf(({level, message, label, timestamp}) => {
        const host: string | undefined = process.env.COMPUTERNAME;
        return `${Colors[level] || ""}(${host})  ${label}[${moment(timestamp).format("LLL")}] <${level}>: ${message}`;
    });

    const logTransports: Transport[] = [new transports.Console()];

    const logDatabaseUrl: string | undefined = SystemConfig.getConfig<Config>().log.databaseUrl;
    if (logDatabaseUrl) {
        logTransports.push(
            new PostgresTransport({
                connection: logDatabaseUrl,
                level: SystemConfig.getConfig<Config>().log.databaseLogLevel,
                table: SystemConfig.getConfig<Config>().log.databaseTable,
            })
        );
    }

    Logger = createLogger({
        level: logLevel,
        format: format.combine(format.label({label: "GHTB"}), format.timestamp(), logFormat),
        transports: logTransports,
    });
    return Logger;
}
