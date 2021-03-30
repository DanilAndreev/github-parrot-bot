/*
 * Author: Danil Andreev | danssg08@gmail.com | https://github.com/DanilAndreev
 *
 * MIT License
 *
 * Copyright (c) 2020 Danil Andreev
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

import {
    BaseEntity,
    Column,
    Entity,
    Index,
    ManyToOne,
    OneToMany, OneToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";
import Chat from "./Chat";
import WebHook from "./WebHook";
import CheckSuite from "./CheckSuite";
import PullRequestMessage from "./PullRequestMessage";


@Entity()
@Index(["pullRequestId", "webhook"], {unique: true})
class PullRequest extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({type: "jsonb"})
    info: PullRequest.Info;

    @Index()
    @ManyToOne(type => Chat, chat => chat.issues, {onDelete: "CASCADE"})
    chat: Chat;

    @ManyToOne(type => WebHook, webhook => webhook.pullRequests, {onDelete: "CASCADE"})
    webhook: WebHook;

    @OneToMany(type => CheckSuite, checksuite => checksuite.pullRequest)
    checksuits: CheckSuite[];

    @Index()
    @Column({type: "bigint"})
    pullRequestId: number;

    @OneToOne(type => PullRequestMessage, chatMessage => chatMessage.pullRequest, {nullable: true})
    chatMessage: PullRequestMessage;

    @UpdateDateColumn()
    updatedAt: Date;
}

namespace PullRequest {
    export interface Info {
        html_url: string;
        tag: number;
        state: string;
        title: string;
        body?: string;
        labels: { name: string }[];
        assignees: { login: string }[];
        opened_by: string;
        requested_reviewers: { login: string }[];
        milestone?: {
            title: string;
            due_on?: string;
        }
    }
}

export default PullRequest;
