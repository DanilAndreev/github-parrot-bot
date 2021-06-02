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

import BotCommand from "../core/bot/BotCommand";
import {ChatMember, Message} from "node-telegram-bot-api";
import Collaborator from "../entities/Collaborator";
import CommandError from "../core/errors/CommandError";
import JSONObject from "../core/interfaces/JSONObject";
import Bot from "../core/bot/Bot";
import Chat from "../entities/Chat";

/**
 * Handler for command:
 * Removes AKA using GitHub username.
 * @class
 * @author Danil Andreev
 */
@BotCommand.Command("disconnect", "[github_username]")
@BotCommand.Description("Breaks link between telegram and github user (by default - you).")
@BotCommand.Option("-a, --all", "Apply this action for each connection for selected user.", false)
@BotCommand.Option("-u, --user <value>", "Apply this action selected user.")
export default class DisconnectCommand extends BotCommand {
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
        let telegramName: string = message.from?.username || message.from?.first_name || "";
        const telegramId: number | undefined = (opts.user ? +opts.user : undefined) || message.from?.id;

        if (!telegramId) throw new CommandError(`Unable to get telegram user.`);

        if (opts.user) {
            try {
                const chatMember: ChatMember = await Bot.getCurrent().getChatMember(chatId, String(telegramId));
                telegramName = chatMember.user.username || chatMember.user.first_name;
            } catch (error) {
                throw new CommandError(`Unable to get telegram user with id: ${telegramId}.`);
            }
        }

        const chat: Chat | undefined = await Chat.findOne({where: {chatId}});
        if (!chat) throw new CommandError(`Error accessing to chat. Try to kick the bot and invite it again.`);

        const result = await Collaborator.delete({chat, telegramId});

        if (!result.affected) throw new CommandError(`User @${telegramName} has no AKA.`);

        return `Successfully deleted all AKAs for @${telegramName}`;
    }

    protected async disconnectOne(message: Message, args: string[], opts: JSONObject<string>): Promise<string> {
        const chatId: number = message.chat.id;
        const [ghName] = args;
        let telegramName: string = message.from?.username || message.from?.first_name || "";
        const telegramId: number | undefined = (opts.user ? +opts.user : undefined) || message.from?.id;

        if (!telegramId) throw new CommandError(`Unable to get telegram user.`);

        if (opts.user) {
            try {
                const chatMember: ChatMember = await Bot.getCurrent().getChatMember(chatId, String(telegramId));
                telegramName = chatMember.user.username || chatMember.user.first_name;
            } catch (error) {
                throw new CommandError(`Unable to get telegram user with id: ${telegramId}.`);
            }
        }

        const chat: Chat | undefined = await Chat.findOne({where: {chatId}});
        if (!chat) throw new CommandError(`Error accessing to chat. Try to kick the bot and invite it again.`);

        const result = await Collaborator.delete({chat, gitHubName: ghName, telegramId});

        if (!result.affected)
            throw new CommandError(`User @${telegramName} is not connected to GitHub account <b>[${ghName}]</b>.`);

        return `Successfully deleted link <b>[${ghName}]</b> -> @${telegramName}`;
    }
}
