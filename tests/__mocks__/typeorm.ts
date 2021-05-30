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

import type * as typeorm from "typeorm";

const typeormMock: jest.Mocked<typeof typeorm> = jest.createMockFromModule("typeorm");

typeormMock.createQueryBuilder = jest.fn().mockReturnValue({
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getOne: jest.fn().mockResolvedValue(undefined),
});

typeormMock.BaseEntity.find = jest.fn().mockResolvedValue(undefined);

typeormMock.Entity = jest.fn().mockImplementation(() => jest.fn());
typeormMock.PrimaryColumn = jest.fn().mockImplementation(() => jest.fn());
typeormMock.PrimaryGeneratedColumn = jest.fn().mockImplementation(() => jest.fn());
typeormMock.Column = jest.fn().mockImplementation(() => jest.fn());
typeormMock.CreateDateColumn = jest.fn().mockImplementation(() => jest.fn());
typeormMock.JoinColumn = jest.fn().mockImplementation(() => jest.fn());
typeormMock.OneToMany = jest.fn().mockImplementation(() => jest.fn());
typeormMock.ManyToOne = jest.fn().mockImplementation(() => jest.fn());
typeormMock.OneToOne = jest.fn().mockImplementation(() => jest.fn());
typeormMock.Index = jest.fn().mockImplementation(() => jest.fn());
typeormMock.UpdateDateColumn = jest.fn().mockImplementation(() => jest.fn());
typeormMock.Index = jest.fn().mockImplementation(() => jest.fn());

module.exports = typeormMock;
