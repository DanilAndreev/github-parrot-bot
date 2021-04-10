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

/* Create sequence for log table auto incrementing id */
CREATE SEQUENCE log_sequence;

/* Create table for log records */
CREATE TABLE log
(
    "id"        INT PRIMARY KEY DEFAULT nextval('log_sequence'),
    "timestamp" TIMESTAMP       DEFAULT now(),
    "level"     VARCHAR(10) NOT NULL,
    "message"   TEXT,
    "meta"      JSON,
    "host"      VARCHAR(255)
);

/* Create function for keeping last n records in database for memory economy. */
CREATE OR REPLACE FUNCTION log_cleaner(records INT) AS
$$
BEGIN
DELETE
FROM "log"
WHERE "id" IN (
    SELECT "id"
    FROM "log"
             OFFSET records
    );
END;
$$;

/* Create trigger for automatic erasing old records on record insert */
CREATE TRIGGER log_cleaner_trigger
    BEFORE INSERT
    ON "log"
    EXECUTE PROCEDURE log_cleaner(2000);
