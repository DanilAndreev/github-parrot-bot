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
import getUsername from "../core/getUsername";
import checkAdmin from "../core/checkAdmin";

export default async function removeAKA(message, match): Promise<CommandFinalMessageSync> {
    const usage = [
        `Usage: /remove_aka [telegram_username] [git_hub_username]`,
        `Example: /remove_aka @danssg08 DanilAndreev`
    ].join("\n");

    const chatId: number = message.from.id;
    const [tag, ghName] = match[1].split(" ");
    const telegramName = getUsername(tag);

    if (!await checkAdmin(message.from.username, message))
        throw new CommandError(`User @${message.from.username} have no permissions to remove AKAs.`);

    const result = ghName ?
        await Collaborator.delete({chatId, gitHubName: ghName, telegramName}) :
        await Collaborator.delete({chatId, telegramName});

    if (!result.affected)
        throw new CommandError(
            ghName ?
                `User @${telegramName} is not connected to GitHub account __[${ghName}]__.` :
                `User @${telegramName} have no AKAs.`
        );
    return ghName ?
        `Successfully deleted link __[${ghName}]__ -> @${telegramName}.` :
        `Successfully deleted all @${telegramName} AKAs.`;
}
