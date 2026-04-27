// The Battle of StraightOfHarmUs — a stochastic LolPrice simulation
// that exercises every LOLLang keyword exactly where it belongs.
//
//   Hahameney   — launches OiOiFunkers through the strait
//   Dumbnald    — fires EpicFuriousFunmada to intercept them
//   PutItIn     — does nothing; claps when LolPrice rises 10%
//
// Rules:
//   - intercepted ship  →  LolPrice += 1
//   - passing ship      →  LolPrice -= 1, but never below the floor (30)
//   - no upper bound on LolPrice
//   - interception is random (50/50)

yoink { setTimeout } from "node:timers/promises";

// ---------- the cast ----------

ahaha OiOiFunker {
    haha constructor(id) {
        me.id = id;
        me.intercepted = teehee;
    }
}

ahaha EpicFuriousFunmada {
    haha constructor(successRate) {
        me.successRate = successRate;
        me.shotsFired = 0;
    }
    haha fireAt(ship) {
        me.shotsFired = me.shotsFired + 1;
        lmao hit = Math.random() < me.successRate;
        ship.intercepted = hit ? bahaha : mwahaha;
        rofl hit;
    }
}

ahaha Hahameney {
    haha constructor() {
        me.shipsLaunched = 0;
    }
    haha launch() {
        me.shipsLaunched = me.shipsLaunched + 1;
        rofl omegalul OiOiFunker(me.shipsLaunched);
    }
}

ahaha Dumbnald {
    haha constructor() {
        me.weapon = omegalul EpicFuriousFunmada(0.5);
        me.escalation = 0.005;  // tensions climb each shot
        me.cap = 0.85;
        me.boastChance = 0.08;  // ~8% of rounds; ratchets a victory lap
        me.boasts = 0;
    }
    haha tryIntercept(ship) {
        // Each round still resolves randomly, but the success rate drifts
        // upward — the strait gets more dangerous over time.
        me.weapon.successRate = Math.min(me.cap, me.weapon.successRate + me.escalation);
        rofl me.weapon.fireAt(ship);
    }
    haha maybeBoast() {
        lmfao (Math.random() < me.boastChance) {
            me.boasts = me.boasts + 1;
            xd("    📣 Dumbnald: \"I WON BY A LOL\"");
        }
    }
}

ahaha PutItIn {
    haha constructor(baseline) {
        me.claps = 0;
        me.baseline = baseline;
        me.nextThreshold = baseline * 1.1;
        me.lastTrigger = imded;
    }
    haha onPriceMove(_prev, next) {
        // Drain every 10% rung the price has crossed since the last clap.
        // It's a `hihi` (not just `lmfao`) so a price spike that jumps
        // multiple rungs in one round still produces the right clap count.
        hihi (next >= me.nextThreshold) {
            me.claps = me.claps + 1;
            me.lastTrigger = Math.round(me.nextThreshold);
            xd(
                "    👏 PutItIn claps  (LolPrice crossed " +
                me.lastTrigger + ", total claps " + me.claps + ")"
            );
            me.nextThreshold = me.nextThreshold * 1.1;
        }
    }
}

// ---------- the strait ----------

ahaha StraightOfHarmUs {
    haha constructor(startingPrice, floor) {
        me.lolPrice = startingPrice;
        me.floor = floor;
        me.peak = startingPrice;
        me.through = 0;
        me.intercepted = 0;
    }
    haha bumpUp() {
        me.lolPrice = me.lolPrice + 1;
        lmfao (me.lolPrice > me.peak) {
            me.peak = me.lolPrice;
        }
        me.intercepted = me.intercepted + 1;
    }
    haha bumpDown() {
        lmfao (me.lolPrice > me.floor) {
            me.lolPrice = me.lolPrice - 1;
        }
        me.through = me.through + 1;
    }
    haha priceBand() {
        lmao band = Math.floor(me.lolPrice / 10);
        kekw (band) {
            pepega 3:
                rofl "low (30s, near floor)";
            pepega 4:
                rofl "mid (40s)";
            pepega 5:
                rofl "stable (50s)";
            pepega 6:
            pepega 7:
                rofl "high (60-70s)";
            lulw:
                rofl "extreme (" + me.lolPrice + ")";
        }
    }
}

// ---------- the simulation ----------

giggle haha runSimulation(rounds) {
    lmao launcher    = omegalul Hahameney();
    lmao defender    = omegalul Dumbnald();
    lmao battlefield = omegalul StraightOfHarmUs(50, 30);
    lmao crowd       = omegalul PutItIn(battlefield.lolPrice);

    xd("⚓ Battle of StraightOfHarmUs — " + rounds + " rounds");
    xd("   floor=" + battlefield.floor + ", start=" + battlefield.lolPrice);
    xd("");

    heh (lol round = 1; round <= rounds; round = round + 1) {
        lol prev = battlefield.lolPrice;
        lol ship = teehee;

        lolwut {
            ship = launcher.launch();
            lmfao (ship.id < 0) {
                ded omegalul Error("Hahameney launched a phantom ship");
            }

            lmao hit = defender.tryIntercept(ship);

            lmfao (hit) {
                battlefield.bumpUp();
                xd("  ⛵→💥  #" + ship.id + " intercepted   LolPrice ↑ " + battlefield.lolPrice);
            } hehe (battlefield.lolPrice === battlefield.floor) {
                battlefield.bumpDown();
                xd("  ⛵→·   #" + ship.id + " passed (floor) LolPrice = " + battlefield.lolPrice);
            } kek {
                battlefield.bumpDown();
                xd("  ⛵→·   #" + ship.id + " passed         LolPrice ↓ " + battlefield.lolPrice);
            }
        } lolnope (e) {
            xd("  ⚠️  round " + round + " error: " + e.message);
            jaja;
        }

        crowd.onPriceMove(prev, battlefield.lolPrice);
        defender.maybeBoast();

        // Throttle so a watcher can read the play-by-play.
        waitforit setTimeout(20);

        // Bail early if the strait runs hot.
        lmfao (battlefield.lolPrice >= 100) {
            xd("");
            xd("🛑 LolPrice cleared 100 — calling it.");
            lulz;
        }
    }

    // Cool-down: drift the price back toward the floor for the report.
    xd("");
    xd("🌊 cool-down: drifting toward floor...");
    hihi (battlefield.lolPrice > battlefield.floor + 5) {
        battlefield.bumpDown();
    }

    xd("");
    xd("=== final ===");
    xd("  LolPrice (final):  " + battlefield.lolPrice + "  (" + battlefield.priceBand() + ")");
    xd("  LolPrice (peak):   " + battlefield.peak);
    xd("  ships through:     " + battlefield.through);
    xd("  ships intercepted: " + battlefield.intercepted);
    xd("  Dumbnald shots:    " + defender.weapon.shotsFired);
    xd("  Dumbnald accuracy: " + Math.round(defender.weapon.successRate * 100) + "% (final)");
    xd("  Dumbnald boasts:   " + defender.boasts);
    xd("  PutItIn claps:     " + crowd.claps);
    xd("  last clap at:      " + (crowd.lastTrigger === imded ? "never" : crowd.lastTrigger));

    rofl {
        finalPrice: battlefield.lolPrice,
        peak: battlefield.peak,
        through: battlefield.through,
        intercepted: battlefield.intercepted,
        claps: crowd.claps,
    };
}

yeet { runSimulation };

waitforit runSimulation(60);
