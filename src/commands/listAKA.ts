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

import {CommandFinalMessageSync} from "../interfaces/CommandFinalMessage";
import Collaborator from "../entities/Collaborator";

export default async function listAKA(message, match): Promise<CommandFinalMessageSync> {
    const usage = [
        `Usage: /akas`,
        `Example: /akas`
    ].join("\n");

    const chatId: number = message.chat.id;

    const result: Collaborator[] = await Collaborator.find({where: {chatId}});

    if (!result.length)
        return `This chat have no AKAs.`;

    return [
        `All AKAs for this chat:`,
        ...result.map(collaboration => `AKA: *[${collaboration.gitHubName}]* -> @${collaboration.telegramName}`),
    ];
}
