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
import {Bot} from "../core/Bot";
import {CommandFinalMessageSync} from "../interfaces/CommandFinalMessage";
import Collaborator from "../entities/Collaborator";

export default async function connectMe(message, match): Promise<CommandFinalMessageSync> {
    const usage = [
        `Usage: /connect_me [git_hub_username]`,
        `Example: /connect_me DanilAndreev`
    ].join("\n");

    const chatId: number = message.chat.id;
    const ghName: string = match[1];
    const telegramName = await message.from.username;

    if (!ghName)
        throw new CommandError("Missing required parameter [git_hub_username]!").addUsage(usage);

    if (ghName.includes(" "))
        throw new CommandError(
            `GitHub username can not contain spaces! `,
            `Input: __[${ghName}]__`
        );


    // TODO: fix bug in groups.
    // try {
    //     await Bot.getChatMember(chatId, telegramName);
    // } catch (error) {
    //     if (message.chat.username !== telegramName)
    //         return `User ${telegramName} is not belong to this chat.`;
    // }

    const storedCollaborator = await Collaborator.findOne({where: {chatId, gitHubName: ghName}});
    if (storedCollaborator)
        throw new CommandError(
            `User [@${storedCollaborator.telegramName}] is already connected to GitHub account [${storedCollaborator.gitHubName}]`
        );

    const collaborator = new Collaborator();
    collaborator.gitHubName = ghName;
    collaborator.telegramName = telegramName;
    collaborator.chatId = chatId;
    const result: Collaborator = await collaborator.save();

    return [
        `Successfully added collaborator.`,
        `GitHub: __${result.gitHubName}__`,
        `Telegram: @${result.telegramName}`
    ];
}