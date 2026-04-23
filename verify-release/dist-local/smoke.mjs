import * as lib from "../../dist/index.mjs";

const requiredExports = [
  "inject",
  "useRequestor",
  "createRequestor",
  "cache",
  "idempotent",
  "retry",
  "concurrent",
  "throttle"
];

const missing = requiredExports.filter((name) => !(name in lib));

if (missing.length > 0) {
  console.error("[verify-release:dist-local] 缺少导出:", missing.join(", "));
  process.exit(1);
}

console.log("[verify-release:dist-local] dist 导出检查通过");
