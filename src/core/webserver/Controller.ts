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

import * as Router from "koa-router";
import {Middleware} from "koa";
import JSONObject from "../../interfaces/JSONObject";


/**
 * Controller - basic controller class for Server.
 * @class
 * @author Danil Andreev
 * @export default
 * @example
 * import {Context} from "koa";
 * class MyController extends Router {
 *     constructor() {
 *         super("/base");
 *         this.get("/hello", this.handlerGet);
 *         //...
 *     }
 *     public handleGet(ctx: Context) {
 *         ctx.body = "hello world";
 *     }
 *     //...
 * }
 */
class Controller extends Router {
    /**
     * baseRoute - prefix route for controller.
     */
    public baseRoute: string;
    /**
     * name - controller name.
     */
    public name: string;

    /**
     * Creates Controller instance.
     * @constructor
     * @author Danil Andreev
     * @param route Basic route of controller. Will work as prefix to all other router inside.
     */
    constructor(route: string = "") {
        super();
        if (!this.baseRoute) this.baseRoute = route;
    }
}

namespace Controller {
    /**
     * Meta - interface for Route metadata.
     * @interface
     * @author Danil Andreev
     */
    export interface RouteMeta {
        /**
         * method - HTTP method.
         */
        method: "GET" | "POST" | "PUT" | "DELETE";
        /**
         * route - target route.
         */
        route: string;
        /**
         * validation - validation middleware.
         */
        validation?: Middleware<any>
        /**
         * middlewares - an array of request middlewares.
         */
        middlewares?: Middleware<any>[];
    }

    /**
     * Route - decorator for HTTP controller route.
     * @param method - HTTP method.
     * @param route - target route.
     * @author Danil Andreev
     */
    export function Route(method: "GET" | "POST" | "PUT" | "DELETE", route: string = "/") {
        return (
            target: Controller,
            propertyKey: string,
            descriptor: PropertyDescriptor,
        ) => {
            if (!Reflect.getMetadata("routes", target))
                Reflect.defineMetadata("routes", {}, target);

            const routes: JSONObject<RouteMeta> = Reflect.getMetadata("routes", target);
            routes[propertyKey] = {...routes[propertyKey], method, route};
        };
    }

    /**
     * RouteValidation - decorator for HTTP controller route middlewares.
     * @author Danil Andreev
     */
    export function RouteMiddleware(...middlewares: Middleware<any>[]) {
        return (
            target: Controller,
            propertyKey: string,
            descriptor: PropertyDescriptor,
        ) => {
            if (!Reflect.getMetadata("routes", target))
                Reflect.defineMetadata("routes", {}, target);

            const routes: JSONObject<RouteMeta> = Reflect.getMetadata("routes", target);
            if (!routes[propertyKey]) routes[propertyKey] = {...routes[propertyKey], middlewares: []};
            const route: RouteMeta = routes[propertyKey];
            route.middlewares?.push(...middlewares);
        };
    }

    /**
     * RouteValidation - decorator for HTTP controller routes validation.
     * @param validation - Validation middleware.
     * @author Danil Andreev
     */
    export function RouteValidation(validation: Middleware<any>) {
        return (
            target: Controller,
            propertyKey: string,
            descriptor: PropertyDescriptor,
        ) => {
            if (!Reflect.getMetadata("routes", target))
                Reflect.defineMetadata("routes", {}, target);

            const routes: JSONObject<RouteMeta> = Reflect.getMetadata("routes", target);

            routes[propertyKey] = {...routes[propertyKey], validation};
        };
    }

    /**
     * NestedController - decorator for adding nested controllers.
     * @param controller - Controller type.
     * @param baseRoute - Base route for nested controller. If declared - will replace native controller base route.
     * @throws TypeError
     * @author Danil Andreev
     */
    export function NestedController(controller: typeof Controller, baseRoute?: string) {
        return function HTTPControllerWrapper<T extends new(...args: any[]) => {}>(objectConstructor: T): T {
            return class WrappedController extends objectConstructor {
                constructor(...args: any[]) {
                    super(args);
                    if (this instanceof Controller) {
                        const instance = new controller();
                        this.use(baseRoute || instance.baseRoute, instance.routes(), instance.allowedMethods());
                    } else {
                        throw new TypeError(`Invalid target class, expected Controller.`);
                    }
                }
            };
        };
    }

    /**
     * HTTPController - decorator for HTTP controllers.
     * @param baseRoute - Base route for controller.
     * @throws TypeError
     * @author Danil Andreev
     */
    export function HTTPController(baseRoute: string = "") {
        return function HTTPControllerWrapper<T extends new(...args: any[]) => {}>(objectConstructor: T): T {
            return class WrappedController extends objectConstructor {
                constructor(...args: any[]) {
                    super(args);
                    if (this instanceof Controller) {
                        this.baseRoute = baseRoute;
                        const routes: JSONObject<RouteMeta> = Reflect.getMetadata("routes", this);
                        if (routes) {
                            for (const key in routes) {
                                const route = routes[key];
                                const callback = this[key];
                                const middlewares: Middleware<any>[] = [];
                                if (route.validation) middlewares.push(route.validation);
                                if (route.middlewares) middlewares.push(...route.middlewares);
                                switch (route.method) {
                                    case "GET":
                                        this.get(route.route, ...middlewares, callback);
                                        break;
                                    case "POST":
                                        this.post(route.route, ...middlewares, callback);
                                        break;
                                    case "PUT":
                                        this.put(route.route, ...middlewares, callback);
                                        break;
                                    case "DELETE":
                                        this.delete(route.route, ...middlewares, callback);
                                        break;
                                    default:
                                        throw new TypeError(`Incorrect value of 'method', expected "'GET' | 'POST' | 'PUT' | 'DELETE'", got ${route.method}`);
                                }
                            }
                        }
                    } else {
                        throw new TypeError(`Invalid target class, expected Controller.`);
                    }
                }
            };
        };
    }
}

export default Controller;
