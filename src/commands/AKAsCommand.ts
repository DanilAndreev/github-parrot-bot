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
import JSONObject from "../interfaces/JSONObject";


@BotCommand.Command("akas")
@BotCommand.Description("Shows all links between Telegram and GtiHub users for this chat.")
@BotCommand.Option("-m, --my", "Show only my AKAs.", false)
export default class AKAsCommand extends BotCommand {
    protected async handler(message: Message, args: string[], opts: JSONObject<string>): Promise<string | string[]> {
        if (opts.my) {
            return await this.showMy(message, args, opts);
        } else {
            return await this.showAll(message, args, opts);
        }
    }


    protected async showAll(message: Message, args: string[], opts: JSONObject<string>): Promise<string | string[]> {
        const chatId: number = message.chat.id;

        const result: Collaborator[] = await Collaborator.find({where: {chatId}});

        if (!result.length)
            return `This chat have no AKAs.`;

        return [
            `All AKAs for this chat:`,
            ...result.map(collaboration => `AKA: <i>[${collaboration.gitHubName}]</i> -> @${collaboration.telegramName}`),
        ];
    }

    protected async showMy(message: Message, args: string[], opts: JSONObject<string>): Promise<string | string[]> {
        const chatId: number = message.chat.id;
        const telegramName = message.from?.username || "";

        const result: Collaborator[] = await Collaborator.find({where: {chatId, telegramName}});

        if (!result.length)
            return `User @${telegramName} have no AKA.`;

        return [
            `User @${telegramName}:`,
            ...result.map(collaboration => `AKA: <b>[${collaboration.gitHubName}]</b>`),
        ];
    }
}
