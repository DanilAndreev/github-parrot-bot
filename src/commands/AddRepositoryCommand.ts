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
import CommandError from "../errors/CommandError";
import checkAdmin from "../utils/checkAdmin";
import WebHook from "../entities/WebHook";
import Chat from "../entities/Chat";
import JSONObject from "../core/interfaces/JSONObject";
import DeleteChatMessageEvent from "../events/telegram/DeleteChatMessageEvent";
import {getConnection} from "typeorm";

/**
 * Handler for command:
 * Creates WebHook object in database and connects it to chat.
 * @class
 * @author Danil Andreev
 */
@BotCommand.Command("add", "<repository> <secret>")
@BotCommand.Description("Connects GitHub repository to this chat", {
    repository: "GitHub repository full name. Example: octocat/Hello-World",
    secret: "Secret string key from GitHub webhook.",
})
export default class AddRepositoryCommand extends BotCommand {
    protected async handler(message: Message, args: string[], opts: JSONObject<string>): Promise<string[]> {
        const chatId: number = message.chat.id;
        const telegramName: string = message.from?.username || "";
        const [repository, secret] = args;

        if (!(await checkAdmin(telegramName, message)))
            throw new CommandError(`User @${telegramName} have no permissions to add repository.`);

        const chat: Chat | undefined = await Chat.findOne({where: {chatId: message.chat.id}});
        if (!chat) throw new CommandError(`Error accessing to chat. Try to kick the bot and invite it again.`);

        if (await WebHook.findOne({where: {chat, repository}}))
            throw new CommandError(
                `Repository <b>[${repository}]</b> is already connected.`,
                `Use /remove command to remove repository.`
            );

        let result: WebHook | JSONObject = {};
        await getConnection().transaction(async transaction => {
            let webhook = new WebHook();
            try {
                webhook.secretPreview = AddRepositoryCommand.createSecretPreview(secret);
            } catch (error) {
                throw new CommandError(error.message);
            }
            webhook.secret = secret;
            webhook.chat = chat;
            webhook.repository = repository;
            webhook = await transaction.save(webhook);
            result = webhook;

            const settings = new WebHook.WebHookSettings();
            settings.webhook = webhook;
            await transaction.save(settings);
        });

        await new DeleteChatMessageEvent(chatId, "" + message.message_id, {}, true).enqueue();
        return [
            `Successfully added repository.`,
            `Name: <b>${result.repository}</b>`,
            `Secret: <code>${result.secretPreview}</code>`,
        ];
    }

    /**
     * createSecretPreview - creates a secret preview string.
     *
     * Example:
     *
     * Secret: "hello darkness my old friend"
     *
     * Preview: "he********nd"
     * @method
     * @author Danil Andreev
     * @param secret - Input secret string.
     * @throws RangeError
     */
    public static createSecretPreview(secret: string) {
        if (secret.length < 4)
            throw new RangeError("Error: secret is too short. It must be at least 4 symbols in length.");
        const head: string = secret.slice(0, 2);
        const tail: string = secret.slice(secret.length - 2, secret.length);
        return head + "********" + tail;
    }
}
