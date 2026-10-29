// Source of truth for the 5 prompts. `node make_tests.js` runs reference/*.java on every input to produce tests.json.
// `prompt` is what students see on the challenge screen. Keep the quoted prompt/output strings exactly as the reference prints them.
module.exports = [
  { id: "candycheck", title: "Program 1 — CandyCheck", cls: "CandyCheck",
    header: "public static String rating(int pieces)",
    prompt: `Read the trick-or-treater's name and how many pieces of candy they collected, then rate the haul.

Prompts (print exactly, no newline after them):
  Name: 
  Pieces of candy: 

Write rating(pieces) so it returns:
  50 or more  ->  "Legendary haul!"
  25 to 49    ->  "Solid haul."
  10 to 24    ->  "Not bad."
  under 10    ->  "The neighbors ghosted you."

Then print one line:  NAME collected N pieces: RATING`,
    samples: [["Kostia","52"],["Amiyah","30"],["Lior","12"],["Matthew","4"]],
    hidden:  [["Sika","50"],["Conrad","25"],["Angel","10"],["Travis","9"],["Nikolay","0"],["Austin","100"]] },
  { id: "hauntedDoor", title: "Program 2 — HauntedDoor", cls: "HauntedDoor",
    header: "public static boolean canEnter(int age, boolean withAdult, boolean scared)",
    prompt: `Decide whether someone may enter the haunted house.

Prompts (print exactly):
  Name: 
  Age: 
  With an adult (true/false): 
  Scared (true/false): 

Write canEnter(age, withAdult, scared): you may enter if you are 12 or older OR with an adult, but never if you are scared.

Then print one line:
  NAME, the door creaks open...       (if they can enter)
  NAME, the ghost blocks your way.    (otherwise)`,
    samples: [["Kostia","14","false","false"],["Lior","9","true","false"],["Amiyah","9","false","false"],["Matthew","15","false","true"]],
    hidden:  [["Sika","12","false","false"],["Travis","11","false","false"],["Angel","11","true","true"],["Hassan","12","true","true"],["Nikolay","30","true","false"],["Conrad","5","false","false"]] },
  { id: "pumpkin", title: "Program 3 — Pumpkin", cls: "Pumpkin",
    header: "public static String verdict(double lbs, boolean rotten)",
    prompt: `Judge a pumpkin by its weight and whether it is rotten.

Prompts (print exactly):
  Weight in pounds: 
  Rotten (true/false): 

Write verdict(lbs, rotten):
  under 10 lbs            ->  "Too small to carve."
  10 lbs or more, rotten  ->  "Compost it."
  50 lbs or more          ->  "Prize pumpkin!"
  otherwise               ->  "Great for carving."

Then print one line:  Verdict: VERDICT`,
    samples: [["60","false"],["25.5","false"],["30","true"],["6.5","false"]],
    hidden:  [["50","false"],["10","false"],["9.9","true"],["100","true"],["49.9","false"],["10","true"]] },
  { id: "cursedWord", title: "Program 4 — CursedWord", cls: "CursedWord",
    header: "public static boolean isCursed(String word)",
    prompt: `Check whether a word is cursed.

Prompt (print exactly):
  Enter a word: 

Write isCursed(word): a word is cursed if it contains the letter z, or if it is 8 or more letters long AND contains the letter o.

Then print two lines:
  Length: N
  WORD is CURSED!     (if cursed)
  WORD is safe.       (otherwise)`,
    samples: [["zombie"],["skeleton"],["pumpkins"],["ghost"]],
    hidden:  [["zzz"],["witchcraft"],["banshee"],["trickster"],["z"],["hollow"],["ooooooooo"],["frankenstein"]] },
  { id: "zombieEscape", title: "Program 5 — ZombieEscape", cls: "ZombieEscape",
    header: "public static String outcome(int speed, int stamina, boolean weapon)",
    prompt: `A zombie attacks! Decide what happens.

Prompts (print exactly):
  Name: 
  Speed: 
  Stamina: 
  Has a weapon (true/false): 

Write outcome(speed, stamina, weapon):
  with a weapon:    stamina 20 or more  ->  "You swing and win!"
                    otherwise           ->  "Too tired to swing. The zombie got you!"
  without a weapon: speed 15 or more AND stamina 10 or more  ->  "You outrun the zombie!"
                    otherwise                                 ->  "The zombie got you!"

Then print two lines:
  NAME faces a zombie!
  OUTCOME`,
    samples: [["Kostia","10","25","true"],["Lior","20","15","true"],["Matthew","18","12","false"],["Amiyah","14","40","false"]],
    hidden:  [["Sika","15","10","false"],["Travis","15","9","false"],["Angel","5","19","true"],["Conrad","14","50","false"],["Hassan","0","20","true"],["Nikolay","15","10","true"]] }
];
