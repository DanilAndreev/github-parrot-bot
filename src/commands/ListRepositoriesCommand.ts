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
import {Message} from "node-telegram-bot-api";
import WebHook from "../entities/WebHook";
import JSONObject from "../core/interfaces/JSONObject";
import Chat from "../entities/Chat";
import CommandError from "../core/errors/CommandError";

/**
 * Handler for command:
 * Listing repositories connected to chat.
 * @class
 * @author Danil Andreev
 */
@BotCommand.Command("list")
@BotCommand.Description("Shows all GitHub repositories connected to this chat.")
export default class ListRepositoriesCommand extends BotCommand {
    protected async handler(message: Message, args: string[], opts: JSONObject<string>): Promise<string | string[]> {
        const chatId: number = message.chat.id;

        await Chat.createIfNotExists(chatId);
        const chat: Chat | undefined = await Chat.findOne({where: {chatId}});
        if (!chat) throw new CommandError(`Error accessing to chat. Try to kick the bot and invite it again.`);

        const result: WebHook[] = await WebHook.find({where: {chat}});

        if (!result.length) return `You have no repositories added.`;

        return [`Connected repositories:`, ...result.map(repo => `<b>[${repo.repository}]</b>`)];
    }
}
