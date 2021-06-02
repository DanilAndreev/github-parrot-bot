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
import CommandError from "../core/errors/CommandError";
import checkAdmin from "../utils/checkAdmin";
import WebHook from "../entities/WebHook";
import JSONObject from "../core/interfaces/JSONObject";
import DrawWebHookSettingsEvent from "../events/draw/DrawWebHookSettingsEvent";

/**
 * Handler for command:
 * Removes repository from chat.
 * @class
 * @author Danil Andreev
 */
@BotCommand.Command("repository", "<repository>")
@BotCommand.Description("Sends repository overview message with settings keyboard.", {
    repository: "GitHub repository full name. Example: octocat/Hello-World",
})
@BotCommand.Option("-t, --text", "Shows repository settings in text mode without keyboard.", false)
export default class WebHookSettingsCommand extends BotCommand {
    protected async handler(message: Message, args: string[], opts: JSONObject<string>): Promise<string | void> {
        const telegramName: string = message.from?.username || "";
        const [repository] = args;

        const entity: WebHook | undefined = await WebHook.findOne({
            where: {chat: message.chat.id, repository},
            relations: ["settings"],
        });

        if (!entity) throw new CommandError(`Repository <b>${repository}</b> not found.`);

        if (!(await checkAdmin(telegramName, message)))
            throw new CommandError(`User @${telegramName} have no permissions to edit repository settings.`);

        if (opts.text) {
            return await this.text(message, args, opts, entity);
        } else {
            await new DrawWebHookSettingsEvent(entity.id).enqueue();
        }
    }

    protected async text(message: Message, args: string[], opts: JSONObject<string>, entity: WebHook): Promise<string> {
        return "Under construction";
    }
}
