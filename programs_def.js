// Source of truth for the 5 prompts. `node make_tests.js` runs reference/*.java on every input to produce tests.json.
module.exports = [
  { id: "candycheck", title: "Program 1 — CandyCheck", cls: "CandyCheck",
    header: "public static String rating(int pieces)",
    samples: [["Kostia","52"],["Amiyah","30"],["Lior","12"],["Matthew","4"]],
    hidden:  [["Sika","50"],["Conrad","25"],["Angel","10"],["Travis","9"],["Nikolay","0"],["Austin","100"]] },
  { id: "hauntedDoor", title: "Program 2 — HauntedDoor", cls: "HauntedDoor",
    header: "public static boolean canEnter(int age, boolean withAdult, boolean scared)",
    samples: [["Kostia","14","false","false"],["Lior","9","true","false"],["Amiyah","9","false","false"],["Matthew","15","false","true"]],
    hidden:  [["Sika","12","false","false"],["Travis","11","false","false"],["Angel","11","true","true"],["Hassan","12","true","true"],["Nikolay","30","true","false"],["Conrad","5","false","false"]] },
  { id: "pumpkin", title: "Program 3 — Pumpkin", cls: "Pumpkin",
    header: "public static String verdict(double lbs, boolean rotten)",
    samples: [["60","false"],["25.5","false"],["30","true"],["6.5","false"]],
    hidden:  [["50","false"],["10","false"],["9.9","true"],["100","true"],["49.9","false"],["10","true"]] },
  { id: "cursedWord", title: "Program 4 — CursedWord", cls: "CursedWord",
    header: "public static boolean isCursed(String word)",
    samples: [["zombie"],["skeleton"],["pumpkins"],["ghost"]],
    hidden:  [["zzz"],["witchcraft"],["banshee"],["trickster"],["z"],["hollow"],["ooooooooo"],["frankenstein"]] },
  { id: "zombieEscape", title: "Program 5 — ZombieEscape", cls: "ZombieEscape",
    header: "public static String outcome(int speed, int stamina, boolean weapon)",
    samples: [["Kostia","10","25","true"],["Lior","20","15","true"],["Matthew","18","12","false"],["Amiyah","14","40","false"]],
    hidden:  [["Sika","15","10","false"],["Travis","15","9","false"],["Angel","5","19","true"],["Conrad","14","50","false"],["Hassan","0","20","true"],["Nikolay","15","10","true"]] }
];
