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

import * as Ajv from "ajv";

export const PostSchema: Ajv.Schema = {
    $id: "github/webhooks/parts/issue",
    type: "object",
    properties: {
        id: {type: "number"},
        node_id: {type: "string", maxLength: 100},
        url: {type: "string", maxLength: 256},
        repository_url: {type: "string", maxLength: 256},
        labels_url: {type: "string", maxLength: 256},
        comments_url: {type: "string", maxLength: 256},
        events_url: {type: "string", maxLength: 256},
        html_url: {type: "string", maxLength: 256},
        number: {type: "integer"},
        state: {type: "string", enum: ["open", "close"]},
        title: {type: "string"},
        body: {type: "string"},
        user: {type: "string"}, //TODO: ref to user
        labels: {
            type: "array",
            items: {}, //TODO: ref to label
        },
        assignee: {}, //TODO: ref to user
        assignees: {
            type: "array",
            items: {}, //TODO: ref to user
        },
        milestone: {}, //TODO: ref to milestone
        locked: {type: "boolean"},
        active_lock_reason: {type: "string"},
        comments: {type: "integer"},
        pull_request: {
            type: "object",
            properties: {
                url: {type: "string", maxLength: 256},
                html_url: {type: "string", maxLength: 256},
                diff_url: {type: "string", maxLength: 256},
                patch_url: {type: "string", maxLength: 256},
            },
            required: ["url", "html_url", "diff_url", "patch_url"],
            additionalProperties: false,
        }
    },
    closed_at: {type: "string", nullable: true},
    required: ["url", "number"],
    additionalProperties: false,
}

export default 1;
