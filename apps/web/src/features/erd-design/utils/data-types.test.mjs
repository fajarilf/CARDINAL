import assert from "node:assert/strict";
import { test } from "node:test";
import { COMMON_DATA_TYPES, getDataTypeOptions } from "./data-types.ts";

test("an empty search offers the common types", () => {
  assert.deepEqual(getDataTypeOptions("", "text"), [...COMMON_DATA_TYPES]);
});

test("search is case insensitive and ignores surrounding spaces", () => {
  assert.deepEqual(getDataTypeOptions(" INT ", "text"), ["smallint", "integer", "bigint"]);
});

test("search text cannot introduce a new datatype", () => {
  assert.deepEqual(getDataTypeOptions("integre", "text"), []);
  assert.equal(getDataTypeOptions("", "text").includes("integre"), false);
});

test("existing custom types are preserved without offering them to new columns", () => {
  assert.equal(getDataTypeOptions("", "varchar(255)")[0], "varchar(255)");
  assert.deepEqual(getDataTypeOptions("255", "varchar(255)"), ["varchar(255)"]);
  assert.equal(getDataTypeOptions("", "text").includes("varchar(255)"), false);
});

test("empty current types and common current types do not add extra options", () => {
  assert.equal(getDataTypeOptions("", "").length, COMMON_DATA_TYPES.length);
  assert.equal(getDataTypeOptions("", "integer").filter((type) => type === "integer").length, 1);
});
