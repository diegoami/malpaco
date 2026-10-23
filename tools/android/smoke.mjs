#!/usr/bin/env node
import {runSmoke} from './run-smoke.mjs';
await runSmoke('tests/android/device-smoke.ts','T106-smoke');
