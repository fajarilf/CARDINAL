import assert from "node:assert/strict";
import { test } from "node:test";
import { getRelationshipError } from "./relationships.ts";

const from = { table: "orders", col: "user_id" };
const to = { table: "users", col: "id" };

function tables() {
  return [
    {
      id: "orders", name: "orders", x: 0, y: 0,
      columns: [{ name: "user_id", type: "integer" }],
    },
    {
      id: "users", name: "users", x: 100, y: 100,
      columns: [{ name: "id", type: "integer", pk: true }],
    },
  ];
}

test("a matching child column can reference a single-column primary key", () => {
  assert.equal(getRelationshipError(from, to, tables(), []), null);
});

test("datatype matching ignores case and surrounding spaces", () => {
  const schema = tables();
  schema[0].columns[0].type = " INTEGER ";
  assert.equal(getRelationshipError(from, to, schema, []), null);
});

test("different datatypes are rejected without modifying either column", () => {
  const schema = tables();
  schema[0].columns[0].type = "text";
  const before = structuredClone(schema);
  assert.match(getRelationshipError(from, to, schema, []), /datatypes must match/);
  assert.deepEqual(schema, before);
});

test("missing datatypes are not accepted as a match", () => {
  const schema = tables();
  schema[0].columns[0].type = "";
  schema[1].columns[0].type = "";
  assert.match(getRelationshipError(from, to, schema, []), /datatypes must match/);
});

test("the target must be a primary key", () => {
  const schema = tables();
  schema[1].columns[0].pk = false;
  assert.match(getRelationshipError(from, to, schema, []), /parent primary-key/);
});

test("one component of a composite primary key cannot be a target", () => {
  const schema = tables();
  schema[1].columns.push({ name: "tenant_id", type: "integer", pk: true });
  assert.match(getRelationshipError(from, to, schema, []), /Composite primary keys/);
});

test("an existing directed foreign key cannot be added twice", () => {
  assert.match(getRelationshipError(from, to, tables(), [{ id: "fk", from, to }]), /already exists/);
});

test("direction matters: a reverse relationship is not the same foreign key", () => {
  const schema = tables();
  schema[0].columns[0].pk = true;
  assert.equal(getRelationshipError(from, to, schema, [{ id: "reverse", from: to, to: from }]), null);
});

test("a table can reference its own primary key through a different column", () => {
  const schema = tables();
  schema[1].columns.push({ name: "manager_id", type: "integer" });
  assert.equal(getRelationshipError({ table: "users", col: "manager_id" }, to, schema, []), null);
});

test("a column cannot reference itself", () => {
  assert.match(getRelationshipError(to, to, tables(), []), /cannot reference itself/);
});

test("missing source or target tables and columns are rejected", () => {
  const missingTable = { table: "missing", col: "id" };
  const missingColumn = { table: "users", col: "missing" };
  for (const [source, target] of [
    [missingTable, to], [from, missingTable],
    [missingColumn, to], [from, missingColumn],
  ]) {
    assert.match(getRelationshipError(source, target, tables(), []), /no longer exists/);
  }
});
