
/* WORLD OF BLESSGLOW — GENRES & SUBGENRES */

const subgenreLists = {
  "Romance": [
    "Campus Romance", "Slow-Burn Romance", "Enemies to Lovers",
    "Friends to Lovers", "Second-Chance Love", "Forbidden Love",
    "Unrequited Love", "Billionaire Romance", "Fake Dating", "Love Triangle"
  ],
  "Revenge & Comebacks": [
    "Betrayed Heiress", "Revenge Against an Ex", "Family Revenge",
    "Revenge After Rejection", "Secret Identity", "The Ultimate Comeback",
    "Revenge and Redemption", "From Underdog to Powerful",
    "The Heiress Returns", "The Revenge Plan"
  ],
  "Dark Romance": [
    "Obsession and Attraction", "Forbidden Dark Love", "Gothic Romance",
    "Mafia Romance", "Morally Grey Love Interests", "Rivals with Chemistry",
    "Dangerous Secrets", "Twisted Relationships", "Possessive Love",
    "The Dangerous Deal"
  ],
  "Royal Stories": [
    "Secret Princess", "Hidden Heir", "Royal Romance",
    "Arranged Royal Marriage", "Lost Princess", "Palace Intrigue",
    "Crown and Succession", "Exiled Royal",
    "Royal Bodyguard Romance", "The Secret Royal Wedding"
  ],
  "Fantasy & Magic": [
    "Dark Fantasy", "Magical Academy", "Witches and Wizards",
    "Cursed Kingdoms", "Mythical Creatures", "Brutal Fantasy",
    "Elemental Powers", "Epic Fantasy Quests", "Dragon Riders",
    "Enchanted Realms"
  ],
  "Werewolf & Shifter": [
    "Alpha and Luna", "Rejected Mates", "Fated Mates",
    "Forbidden Mates", "Royal Werewolves", "Rogue Wolves",
    "Hidden Shifter", "Human and Werewolf", "The Alpha's Secret",
    "War of the Wolf Packs"
  ],
  "Mystery & Secrets": [
    "Murder Mystery", "The Missing Heiress", "Hidden Identity",
    "Family Secrets", "Secret Societies", "Locked-Room Mystery",
    "Supernatural Mystery", "Detective Investigations",
    "The Secret Nobody Knows", "The Inheritance Mystery"
  ],
  "Thriller & Suspense": [
    "Psychological Thriller", "Crime Thriller", "Conspiracy",
    "Survival Thriller", "Cat and Mouse", "Domestic Suspense",
    "High-Stakes Pursuits", "Political Thriller",
    "The Stalker Next Door", "The Dangerous Witness"
  ],
  "Drama & Scandals": [
    "Family Drama", "Betrayal and Lies", "Friendship Conflicts",
    "Love Triangles", "Marriage Drama", "Social-Class Conflict",
    "Secrets and Scandals", "Sibling Rivalry",
    "Celebrity Scandals", "The Secret Inheritance"
  ],
  "Young Adult & Coming-of-Age": [
    "First Love", "School Life", "University Life", "Academic Rivals",
    "Friendship and Loyalty", "Identity and Self-Discovery",
    "Family Expectations", "Young Adult Fantasy", "Dark Academia",
    "The New Girl"
  ],
  "Healing & Second Chances": [
    "Healing After Heartbreak", "Starting Over", "Redemption",
    "Forgiveness and Healing", "Rebuilding Trust", "Finding Yourself",
    "Fresh Beginnings", "Learning to Let Go", "Life After Betrayal",
    "Recovering from Loss"
  ],
  "Vampires & Immortals": [
    "Vampire Romance", "Ancient Vampires", "Vampire Royalty",
    "Immortal Love", "Human and Vampire", "Vampire Hunters",
    "Cursed Immortals", "Supernatural Clans", "Vampire Academy",
    "The Forbidden Bloodline"
  ]
};

function updateSubgenres(genre, selected = "") {
  const select = document.getElementById("subgenre");
  if (!select) return;

  select.innerHTML = "";

  const options = subgenreLists[genre] || [];

  select.add(new Option(
    options.length ? "Select subgenre" : "Select main genre first", ""
  ));

  options.forEach(name => select.add(new Option(name, name)));

  select.disabled = !options.length;

  if (options.includes(selected)) select.value = selected;
}

document.getElementById("genre")?.addEventListener("change", event => {
  updateSubgenres(event.target.value);
});
    
