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
import checkAdmin from "../utils/checkAdmin";
import CommandError from "../errors/CommandError";
import Collaborator from "../entities/Collaborator";
import JSONObject from "../interfaces/JSONObject";
import Chat from "../entities/Chat";

@BotCommand.Command("clear_aka")
@BotCommand.Description("Removes all AKAs in this chat.")
export default class ClearAKACommand extends BotCommand {
    protected async handler(message: Message, args: string[], opts: JSONObject<string>): Promise<string> {
        const chatId: number = message.chat.id;
        const telegramName = message.from?.username || "";

        if (!(await checkAdmin(telegramName, message)))
            throw new CommandError(`User @${telegramName} have no permissions to remove AKAs.`);

        const chat: Chat | undefined = await Chat.findOne({where: {chatId}});
        if (!chat) throw new CommandError(`Error accessing to chat. Try to kick the bot and invite it again.`);

        const result = await Collaborator.delete({chat});

        if (!result.affected) throw new CommandError(`This chat has no AKAs.`);
        return `Successfully deleted all AKAs.`;
    }
}
