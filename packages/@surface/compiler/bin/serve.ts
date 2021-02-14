#!/usr/bin/env node

import { parsePattern, toBoolean } from "../internal/common.js";
import { logLevelPattern }         from "../internal/patterns.js";
import Tasks                       from "../internal/tasks.js";
import createProgram               from "./create-program.js";

const program = createProgram()
    .option("--host              <n>", "Dev server hostname.")
    .option("--hot               [n]", "Enable hot reload.", toBoolean)
    .option("--log-level         <n>", "Output verbosity level. Can be 'detailed', 'errors-only', 'errors-warnings', 'minimal', 'none', 'normal', 'summary' or 'verbose'.", parsePattern(logLevelPattern))
    .option("--port              <n>", "Dev server port.", Number)
    .action(x => void Tasks.serve(x));

program.parse(process.argv);