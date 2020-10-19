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

import CommandError from "../core/CommandError";
import WebHook from "../entities/WebHook";
import {CommandFinalMessageSync} from "../interfaces/CommandFinalMessage";

export default async function removeRepository(message, match): Promise<CommandFinalMessageSync> {
    const usage = [
        `Usage: /remove [repository_full_name]`,
        `Example: /remove DanilAndreev/test_repo`
    ].join("\n");

    const chatId: number = message.from.id;
    const repository: string = match[1];

    const result = await WebHook.delete({chatId, repository});
    if (!result.affected) throw new CommandError(`Repository __[${repository}]__ not found.`);
    return `Successfully deleted repository __[${repository}]__.`;
}
