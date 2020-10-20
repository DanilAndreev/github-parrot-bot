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
import * as argon2 from "argon2";
import createSecretPreview from "../core/createSecretPreview";
import {Bot} from "../core/Bot";
import {CommandFinalMessageSync} from "../interfaces/CommandFinalMessage";
import checkAdmin from "../core/checkAdmin";

export default async function addRepository(message, match): Promise<CommandFinalMessageSync> {
    const usage = [
        `Usage: /add [repository_full_name] [secret]`,
        `Example: /add DanilAndreev/test_repo webhook_secret_string`
    ].join("\n");

    const chatId: number = message.from.id;
    const telegramName: string = message.from.username;
    const [repository, secret] = match[1] && match[1].split(" ");

    if (!repository)
        throw new CommandError("Missing required parameter repository_full_name!").addUsage(usage);

    if (!secret)
        throw new CommandError("Missing required parameter secret!").addUsage(usage);

    if (!await checkAdmin(telegramName, message))
        throw new CommandError(`User @${telegramName} have no permissions to add repository.`);

    if (await WebHook.findOne({where: {chatId, repository}}))
        throw new CommandError(
            `Repository __[${repository}]__ is already connected.`,
            `Use /remove [repo_name] to remove repository.`
        );


    const webhook = new WebHook();
    webhook.secret = await argon2.hash(secret);
    webhook.secretPreview = createSecretPreview(secret);
    webhook.chatId = chatId;
    webhook.repository = repository;
    const result = await webhook.save();
    await Bot.deleteMessage(chatId, "" + message.message_id);
    return [
        `Successfully added repository.`,
        `Name: __${result.repository}__`,
        `Secret: \`\`\`${result.secretPreview}\`\`\`__`
    ];
}