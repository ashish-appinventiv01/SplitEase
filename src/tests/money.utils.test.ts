import assert from "node:assert/strict";
import { CommonUtils } from "../common/utils";

function run(): void {
  assert.equal(CommonUtils.rupeesToPaise(100.5), 10050);
  assert.equal(CommonUtils.rupeesToPaise(0), 0);
  assert.equal(CommonUtils.paiseToRupees(10050), 100.5);
  assert.equal(CommonUtils.paiseToRupees(-500), -5);

  assert.deepEqual(CommonUtils.splitEqually(1000, 3), [334, 333, 333]);
  assert.deepEqual(CommonUtils.splitEqually(100, 2), [50, 50]);
  assert.deepEqual(CommonUtils.splitEqually(1, 3), [1, 0, 0]);

  const equalSplit = CommonUtils.splitEqually(999, 4);
  assert.equal(
    equalSplit.reduce((sum, value) => sum + value, 0),
    999
  );

  const pagination = CommonUtils.getPagination({ page: 2, limit: 150 });
  assert.equal(pagination.limit, 100);
  assert.equal(pagination.skip, 100);

  console.log("money.utils.test.ts: all assertions passed");
}

run();
