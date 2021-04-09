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

import Chrono from "../core/Chrono";
import {DeleteResult} from "typeorm";
import PullRequest from "../entities/PullRequest";
import {Logger} from "../core/Logger";

/**
 * PullRequestsGarbageCollector - class for deleting outdated pull requests.
 * @class
 * @author Danil Andreev
 */
export default class PullRequestsGarbageCollector extends Chrono {
    protected async run(): Promise<void> {
        try {
            const result: DeleteResult = await PullRequest.createQueryBuilder()
                .delete()
                .where("updatedAt < current_timestamp - interval '1 hour'")
                .execute();
            Logger?.info(`Issues garbage collector: deleted ${result.affected} items.`);
        } catch (error) {
            Logger?.error(`Failed to execute cron function PullRequestsGarbageCollector.`, error);
        }
    }
}
