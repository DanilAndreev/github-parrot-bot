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

import WebHookAmqpHandler from "../../core/amqp/WebHookAmqpHandler";
import {QUEUES} from "../../globals";
import AmqpHandler from "../../core/amqp/AmqpHandler";
import loadTemplate from "../../utils/loadTemplate";
import DrawPushEvent from "../../events/draw/DrawPushEvent";
import Bot from "../../core/bot/Bot";

@WebHookAmqpHandler.Handler(QUEUES.PUSH_SHOW_QUEUE, 10)
@Reflect.metadata("amqp-handler-type", "draw-event-handler")
export default class DrawPushHandler extends AmqpHandler {
    protected async handle(content: DrawPushEvent.Serialized): Promise<void | boolean> {
        const {pusher, head_commit, repository, ref} = content.push;

        const split = ref.split("/");
        const branch: string = split[split.length - 1];

        const template = await loadTemplate("push");

        const message: string = template({
            repository: repository.full_name,
            message: head_commit.message,
            pusher: pusher.name,
            ref: branch,
        })
            .replace(/  +/g, " ")
            .replace(/\n +/g, "\n");

        await Bot.getCurrent().sendMessage(content.chat, message, {
            parse_mode: "HTML",
            reply_markup: {
                inline_keyboard: [[{text: "View on GitHub", url: head_commit.url}]],
            },
        });
    }
}
