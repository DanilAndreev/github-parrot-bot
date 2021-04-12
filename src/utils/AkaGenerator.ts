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

import Collaborator from "../entities/Collaborator";
import CommandError from "../errors/CommandError";
import toKeyPair from "./toKeyPair";
import fromKeyPair from "./fromKeyPair";

class AkaGenerator {
    protected chatId: number;

    public constructor(chatId: number) {
        this.chatId = chatId;
    }

    public async getAka(login: string): Promise<AkaGenerator.User> {
        try {
            const result: AkaGenerator.User | undefined = await Collaborator.createQueryBuilder()
                .select("id")
                .addSelect("gitHubName", "login")
                .addSelect("telegramUsername", "tag")
                .where("chatId = :chatId", {chatId: this.chatId})
                .andWhere("gitHubName = :login", {login})
                .getRawOne();

            return result || {login};
        } catch (error) {
            throw new CommandError(`Failed to get AKA for user "${login}":`, error);
        }
    }

    public async getAkas(logins: string[]): Promise<AkaGenerator.User[]> {
        try {
            const result: AkaGenerator.User[] = await Collaborator.createQueryBuilder()
                .select("id")
                .addSelect("gitHubName", "login")
                .addSelect("telegramUsername", "tag")
                .where("chatId = :chatId", {chatId: this.chatId})
                .andWhere("gitHubName IN(:logins)", {logins})
                .getRawMany();

            const combined: AkaGenerator.User[] = fromKeyPair({
                ...toKeyPair(
                    logins.map((item: string): AkaGenerator.User => ({login: item})),
                    (item: AkaGenerator.User): string => item.login
                ),
                ...toKeyPair(result, (item: AkaGenerator.User): string => item.login),
            });

            return combined;
        } catch (error) {
            throw new CommandError("Failed to get AKA for users:", logins, ":", error);
        }
    }
}

namespace AkaGenerator {
    export interface User {
        login: string;
        tag?: string;
    }
}

export default AkaGenerator;
