# T30 round origin and victory acceptance

Pinned design: archaeology commit ae298e37c2f5177039e55767607f9345b6cb0e7a, core-rules.md Seats, The turn and Victory, plus ui.md end-game flow. Round origin follows the seeded first seat and eliminated-seat skips. Victory checks run after a completed move/turn before next income, ordered conquest, last seat, optional domination, completed-round limit and human loss. Domination is35 of46; limit ties use countries, armies, then later seat in rotated turn order. No original assets/code enter this repository.

Parent acceptance preflight precedes production implementation. Main session owns the acceptance checks; native Sol High implements Hard T30 after actual negatives/disposable mock positives/restoration are retained. MiniMax M3 reviews independently. Existing presets/goldens remain protected; save integration belongs to T31 and computer scheduling/default setup to T32.
