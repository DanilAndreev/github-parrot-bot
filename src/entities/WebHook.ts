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
    CreateDateColumn,
    Entity,
    Index, JoinColumn,
    ManyToOne,
    OneToMany, OneToOne,
    PrimaryGeneratedColumn,
} from "typeorm";
import Chat from "./Chat";
import Issue from "./Issue";
import PullRequest from "./PullRequest";
import CheckSuite from "./CheckSuite";

/**
 * PullRequest - entity for storing webhook settings.
 * @author Danil Andreev
 */
@Entity()
@Index(["chat", "repository"], {unique: true})
class WebHook extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(type => Chat, chat => chat.webhooks, {onDelete: "CASCADE"})
    chat: Chat;

    @OneToMany(type => Issue, issue => issue.webhook)
    issues: Issue[];

    @OneToMany(type => PullRequest, pullRequest => pullRequest.webhook)
    pullRequests: PullRequest[];

    @OneToMany(type => CheckSuite, checksuite => checksuite.webhook)
    checksuits: CheckSuite[];

    @OneToOne(type => WebHook.WebHookSettings, settings => settings.webhook, {nullable: false})
    settings: WebHook.WebHookSettings;

    @Column()
    secret: string;

    @Column()
    secretPreview: string;

    @Column()
    repository: string;

    @CreateDateColumn()
    createdAt: Date;
}

namespace WebHook {
    @Entity()
    export class WebHookSettings extends BaseEntity {
        @PrimaryGeneratedColumn({type: "bigint"})
        id: number;

        @OneToOne(type => WebHook, webhook => webhook.settings)
        @JoinColumn()
        webhook: WebHook;

        @Column({type: "boolean", default: false})
        trackPushes: boolean;

        @Column({type: "boolean", default: false})
        trackFreeCI: boolean;

        @Column({type: "boolean", default: false})
        trackPullRequestCI: boolean;
    }
}

export default WebHook;
