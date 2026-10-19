# Exact omission of irrelevant label distances

Parent scope decision,2026-10-19, after the retained allocation-only candidate missed its predefined10% benefit gate (actual9.208%). That failed candidate remains historical, unadopted. This permits one additional feasibility candidate under T75; it changes no Done-when, deadline, geometry version or release gate. Existing heavy CPU measurements identify label distances as a hot path. The unexplained165/166 acceptance failure remains binding; this is not a claimed causal diagnosis.

## Local proof

The private `labelGap` is used only in the ordered label loop in `derivePresentation`. For each label the original computes:

```
x = Math.max(0, Math.abs(p[0] - c[0]) - 20)
y = Math.max(0, Math.abs(p[1] - c[1]) - 20)
d = Math.hypot(x, y)
```

The candidate must evaluate the same x and y expressions in that order. Only if both are finite and `(x > 24 || y > 24)` may it return Infinity in place of d. All other cases retain the original Math.hypot(x,y).20 and24 are existing drawing constants, not new tuning values.

For nonnegative finite components, the Euclidean norm is at least each component. The fast branch therefore has original d strictly greater than24. In the original loop it cannot trigger the less-than1e-10 early return, and `if(d > 24) continue` performs no force or weight addition. Replacing it with Infinity takes the identical skip. The equality24 case still computes the original norm and performs exactly the original operations, including zero-weight additions; no signed-zero assumption is needed.

The only remaining use of d is `minimumLabelGap = Math.min(minimumLabelGap,d)`. That temporary is read solely through `Math.min(1,minimumLabelGap/3)**2`. If an unskipped label has d<=24, every skipped value is larger and cannot change that minimum. If all retained finite distances are greater than24 or no finite distances remain, original and candidate multipliers both evaluate to exactly1. A retained NaN still propagates through Math.min and downstream arithmetic in either version. Thus the unsaturated temporary may differ, but its consumed multiplier is identical.

Requiring BOTH components finite preserves Math.hypot's original NaN/Infinity cases, including its Infinity-over-NaN behavior. No input validation is strengthened. Existing label order, all nearby force arithmetic/grouping, early returns, original constants, per-step label updates and route/port computations remain unchanged. No protected-segment distance is omitted and no approximate distance is computed. No scratch buffer escapes its synchronous derive call if the separately proved scratch-return change is included.

## Required validation and limits

This proof authorizes a candidate, not adoption. Run the unchanged full frozen drawing/engine/save/RNG/refusal unit file once and compare complete actual Worker inputs and outputs with the preserved baseline. Retain a single paired literal-fixture original5000ms measurement, measured benefit and all failures. Original source/output bytes and modes must be restored afterward. Require at least10% Worker-median benefit against the immutable1921.7ms baseline pair; no threshold rounding or extra rerun. A passing measurement is a single-host feasibility result, not a universal timing guarantee or proof of the previous failure's cause.

Formal adoption, exact-input provenance, full integrated/extracted acceptance, independent correction review and one exact-head green CI remain required before publication. All prior evidence and limitations remain retained.
