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
import CommandError from "../errors/CommandError";
import checkAdmin from "../utils/checkAdmin";
import WebHook from "../entities/WebHook";
import JSONObject from "../interfaces/JSONObject";
import Chat from "../entities/Chat";

@BotCommand.Command("remove", "<repository>")
@BotCommand.Description("Disconnects GitHub repository from this chat", {
    repository: "GitHub repository full name. Example: octocat/Hello-World",
})
@BotCommand.Option("-a, --all", "Remove all connected GitHub repositories.", false)
export default class RemoveRepositoryCommand extends BotCommand {
    protected async handler(message: Message, args: string[], opts: JSONObject<string>): Promise<string> {
        const telegramName: string = message.from?.username || "";
        const [repository] = args;

        if (!(await checkAdmin(telegramName, message)))
            throw new CommandError(`User @${telegramName} have no permissions to delete repositories.`);

        if (opts.all) {
            return await this.removeAll(message, args, opts);
        } else if (repository) {
            return await this.removeOne(message, args, opts);
        } else {
            throw new CommandError(`Specify <b>repository</b> or use <i>--all</i> flag.`);
        }
    }

    protected async removeOne(message: Message, args: string[], opts: JSONObject<string>): Promise<string> {
        const chatId: number = message.chat.id;
        const [repository] = args;

        const chat: Chat | undefined = await Chat.findOne({where: {chatId}});
        if (!chat) throw new CommandError(`Error accessing to chat. Try to kick the bot and invite it again.`);

        const result = await WebHook.delete({chat, repository});
        if (!result.affected) throw new CommandError(`Repository <b>[${repository}]</b> not found.`);
        return `Successfully deleted repository <b>[${repository}]</b>.`;
    }

    protected async removeAll(message: Message, args: string[], opts: JSONObject<string>): Promise<string> {
        const chatId: number = message.chat.id;

        const chat: Chat | undefined = await Chat.findOne({where: {chatId}});
        if (!chat) throw new CommandError(`Error accessing to chat. Try to kick the bot and invite it again.`);

        const result = await WebHook.delete({chat});
        if (!result.affected) throw new CommandError(`You have no repositories to delete.`);
        return `Successfully deleted all repositories.`;
    }
}
