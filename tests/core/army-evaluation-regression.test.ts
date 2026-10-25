import {expect,test} from 'vitest';
import corpus from '../../fixtures/arena/allocation-v1-regression.json';
import {planAllocation} from '../../src/core/computer-allocation';
import type {ComputerStrategicView} from '../../src/core/computer-view';
// Public inputs and exact decisions frozen from measured 941d7f8, not regenerated
// from the extracted evaluator. Includes both phases, sizes/ties and budget exits.
test('measured allocation-v1 decisions and work accounting remain exact',()=>{
 expect(corpus.sourceCommit).toBe('941d7f88a31f9e29bfb335e8c563d431b63094ac');
 expect(corpus.cases).toHaveLength(26);
 for(const sample of corpus.cases)expect(planAllocation(sample.view as ComputerStrategicView),sample.name).toEqual(sample.decision);
});
