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

import {BaseEntity, CreateDateColumn, Entity, OneToMany, PrimaryColumn} from "typeorm";
import WebHook from "./WebHook";
import Collaborator from "./Collaborator";
import Issue from "./Issue";
import CheckSuite from "./CheckSuite";
import {Logger} from "../core/logger/Logger";

/**
 * Chat - entity for storing connected telegram chat.
 * @author Danil Andreev
 */
@Entity()
export default class Chat extends BaseEntity {
    /**
     * createIfNotExists - creates chat instance if it not exists.
     * @param chatId - Target chat id.
     * @author Danil Andreev
     */
    static async createIfNotExists(chatId: number): Promise<typeof Chat> {
        const chat = new Chat();
        chat.chatId = chatId;
        try {
            await chat.save();
            Logger.warn(`Added new chat on "createIfNotExists" method. Chat id: ${chatId}`);
        } catch (error) {
            // QueryFailedError (duplicate key value violates unique key constraint).
            if (error.code !== "23505")
                throw error;
        }
        return this;
    }

    @PrimaryColumn({type: "bigint"})
    chatId: number;

    @OneToMany(type => WebHook, webhook => webhook.chat)
    webhooks: WebHook[];

    @OneToMany(type => Collaborator, collaborator => collaborator.chat)
    collaborators: Collaborator[];

    @OneToMany(type => Issue, issue => issue.chat)
    issues: Issue[];

    @OneToMany(type => CheckSuite, checksuite => checksuite.chat)
    checksuits: CheckSuite[];

    @CreateDateColumn()
    createdAt: Date;
}
