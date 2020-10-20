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
import {CommandFinalMessageSync} from "../interfaces/CommandFinalMessage";
import Collaborator from "../entities/Collaborator";

export default async function disconnectMe(message, match): Promise<CommandFinalMessageSync> {
    const usage = [
        `Usage: /disconnect_me [git_hub_username]`,
        `Example: /disconnect_me DanilAndreev`
    ].join("\n");

    const chatId: number = message.from.id;
    const ghName: string = match[1];
    const telegramName = message.from.username;

    if (ghName.includes(" "))
        throw new CommandError(
            `GitHub username can not contain spaces! `,
            `Input: __[${ghName}]__`
        );

    const result = await Collaborator.delete({chatId, gitHubName: ghName, telegramName});


    if (!result.affected)
        throw new CommandError(`User @${telegramName} is not connected to GitHub account __[${ghName}]__.`);
    return `Successfully deleted link __[${ghName}]__ -> @${telegramName}`;
}
