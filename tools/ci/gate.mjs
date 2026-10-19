import {gatePass} from './policy.mjs';
const input = {
  classificationResult:process.env.CLASSIFICATION_RESULT,
  mode:process.env.CI_MODE,
  verificationResult:process.env.VERIFICATION_RESULT,
};
const passed = gatePass(input);
console.log(JSON.stringify({...input, passed}));
process.exitCode = passed ? 0 : 1;
