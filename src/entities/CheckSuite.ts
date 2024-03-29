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

import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    OneToMany,
    OneToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";
import Chat from "./Chat";
import PullRequest from "./PullRequest";
import CheckRun from "./CheckRun";
import WebHook from "./WebHook";

/**
 * CheckSuite - entity for storing github check suits information.
 * @author Danil Andreev
 */
@Entity()
@Index(["suiteId", "pullRequest"], {unique: true})
@Index(["suiteId", "chat"], {unique: true})
class CheckSuite extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({type: "jsonb"})
    info: CheckSuite.Info;

    @Index()
    @Column({type: "varchar", length: 40})
    headSha: string;

    @Index()
    @ManyToOne(type => Chat, chat => chat.checksuits, {onDelete: "CASCADE"})
    chat: Chat;

    @ManyToOne(type => WebHook, webhook => webhook.checksuits, {onDelete: "CASCADE"})
    webhook: WebHook;

    @OneToMany(type => CheckRun, run => run.suite)
    runs: CheckRun[];

    @ManyToOne(type => PullRequest, pullRequest => pullRequest.checksuits, {
        onDelete: "CASCADE",
        nullable: true,
    })
    pullRequest?: PullRequest;

    @Index()
    @Column({type: "bigint"})
    suiteId: number;

    @OneToOne(type => CheckSuite.CheckSuiteMessage, chatMessage => chatMessage.suite, {nullable: true})
    chatMessage: CheckSuite.CheckSuiteMessage;

    @UpdateDateColumn()
    updatedAt: Date;

    @CreateDateColumn()
    createdAt: Date;
}

namespace CheckSuite {
    /**
     * info - GitHub check suite info.
     * @interface
     * @author Danil Andreev
     */
    export interface Info {
        branch: string;
        conclusion?: string;
        status: string;
    }

    /**
     * CheckSuiteMessage - entity for storing check suite active telegram chat message.
     * @author Danil Andreev
     */
    @Entity()
    @Index(["suite", "messageId"], {unique: true})
    export class CheckSuiteMessage extends BaseEntity {
        @PrimaryGeneratedColumn()
        id: number;

        @Column({type: "bigint", nullable: true})
        messageId: number;

        @OneToOne(type => CheckSuite, suite => suite.chatMessage, {onDelete: "CASCADE"})
        @JoinColumn()
        suite: CheckSuite;

        @UpdateDateColumn()
        updatedAt: Date;
    }
}

export default CheckSuite;
