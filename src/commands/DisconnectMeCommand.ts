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

import BotCommand from "../core/BotCommand";
import {Message} from "node-telegram-bot-api";
import Collaborator from "../entities/Collaborator";
import CommandError from "../errors/CommandError";
import JSONObject from "../interfaces/JSONObject";


@BotCommand.Command("disconnect_me", "[github_username]")
@BotCommand.Description("Breaks link between telegram and github user.")
@BotCommand.Option("-a, --all", "Disconnect all my github accounts.", false)
export default class DisconnectMeCommand extends BotCommand {
    protected async handler(message: Message, args: string[], opts: JSONObject<string>): Promise<string | string[]> {
        const [githubUsername] = args;

        if (opts.all) {
            return await this.disconnectAll(message, args, opts);
        } else if (githubUsername) {
            return await this.disconnectOne(message, args, opts);
        } else {
            throw new CommandError(`Specify <b>github_username</b> or use <i>--all</i> flag.`);
        }
    }

    protected async disconnectAll(message: Message, args: string[], opts: JSONObject<string>): Promise<string> {
        const chatId: number = message.chat.id;
        const telegramName = message.from?.username || "";

        const result = await Collaborator.delete({chatId, telegramName});

        if (!result.affected)
            throw new CommandError(`User @${telegramName} has no AKA.`);

        return `Successfully deleted all AKAs for @${telegramName}`;
    }

    protected async disconnectOne(message: Message, args: string[], opts: JSONObject<string>): Promise<string> {
        const chatId: number = message.chat.id;
        const [ghName] = args;
        const telegramName = message.from?.username || "";

        const result = await Collaborator.delete({chatId, gitHubName: ghName, telegramName});

        if (!result.affected)
            throw new CommandError(`User @${telegramName} is not connected to GitHub account __[${ghName}]__.`);

        return `Successfully deleted link <b>[${ghName}]</b> -> @${telegramName}`;
    }
}
