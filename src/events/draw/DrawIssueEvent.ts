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

import AmqpEvent from "../../core/AmqpEvent";
import {QUEUES} from "../../globals";

class DrawIssueEvent extends AmqpEvent {
    public static readonly type: string = "draw-issue-event";
    public issue: number;
    public forceNewMessage: boolean;

    constructor(issue: number, forceNewMessage: boolean = false) {
        super(DrawIssueEvent.type, {
            queue: QUEUES.ISSUE_SHOW_QUEUE,
        });
        this.issue = issue;
        this.forceNewMessage = forceNewMessage;
    }

    public serialize(): DrawIssueEvent.Serialized {
        return {
            ...super.serialize(),
            issue: this.issue,
            forceNewMessage: this.forceNewMessage,
        };
    }
}

namespace DrawIssueEvent {
    export interface Serialized extends AmqpEvent.Serialized {
        issue: number;
        forceNewMessage: boolean;
    }
}

export default DrawIssueEvent;
