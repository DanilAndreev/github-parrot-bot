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
    JoinColumn,
    ManyToOne,
    OneToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";
import Chat from "./Chat";
import WebHook from "./WebHook";

/**
 * Issue - entity for storing github issues information.
 * @author Danil Andreev
 */
@Entity()
@Index(["webhook", "issueId"], {unique: true})
class Issue extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({type: "jsonb"})
    info: Issue.Info;

    @Index()
    @ManyToOne(type => Chat, chat => chat.issues, {onDelete: "CASCADE"})
    chat: Chat;

    @ManyToOne(type => WebHook, webhook => webhook.issues, {onDelete: "CASCADE"})
    webhook: WebHook;

    @Column({type: "bigint"})
    issueId: number;

    @OneToOne(type => Issue.IssueMessage, issueMessage => issueMessage.issue, {nullable: true})
    chatMessage: Issue.IssueMessage;

    @UpdateDateColumn()
    updatedAt: Date;
}

namespace Issue {
    /**
     * Info - GitHub issue info.
     * @interface
     * @author Danil Andreev
     */
    export interface Info {
        tag: number;
        state: string;
        title: string;
        body?: string;
        opened_by: { login: string, tag?: string};
        assignees: { login: string, tag?: string }[];
        labels: { name: string }[];
        milestone?: {
            title: string;
            due_on?: string;
        };
        html_url: string;
    }

    /**
     * IssueMessage - entity for storing issue active telegram chat message.
     * @author Danil Andreev
     */
    @Entity()
    @Index(["issue", "messageId"], {unique: true})
    export class IssueMessage extends BaseEntity {
        @PrimaryGeneratedColumn()
        id: number;

        @Column({type: "bigint", nullable: true})
        messageId: number;

        @OneToOne(type => Issue, issue => issue.chatMessage, {onDelete: "CASCADE"})
        @JoinColumn()
        issue: Issue;

        @UpdateDateColumn()
        updatedAt: Date;
    }
}

export default Issue;
