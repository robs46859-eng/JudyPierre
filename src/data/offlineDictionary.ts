import { OfflinePhrase } from "../types";

export const OFFLINE_DICTIONARY: Record<string, OfflinePhrase[]> = {
  Spanish: [
    {
      category: "Diva Survival",
      english: "Where is the nearest luxury boutique hotel?",
      translated: "¿Dónde está el hotel boutique de lujo más cercano?",
      pronunciation: "Dohn-deh ehs-tah el oh-tel boo-teek deh loo-ho mahs sehr-kah-no?",
      insight: "Darling, never ask for a generic motel. Always sound like you have a reservation in the penthouse, even if you are just washing your face in their restroom."
    },
    {
      category: "Dining & Drama",
      english: "This espresso is colder than my ex's heart.",
      translated: "Este café expreso está más frío que el corazón de mi ex.",
      pronunciation: "Ehs-teh kah-feh ek-spreh-so ehs-tah mahs free-oh keh el koh-rah-sohn deh mee ex.",
      insight: "Say this with a dramatic sigh and a flip of your hair. They will bring you a piping hot one immediately out of sheer respect for the theatre."
    },
    {
      category: "Fashion & Social",
      english: "I need a sparkling wine, and make it snappy!",
      translated: "Necesito un vino espumoso, ¡y que sea rápido!",
      pronunciation: "Neh-seh-see-toh oon bee-no ehs-poo-moh-so, ee keh seh-ah rah-pee-doh!",
      insight: "A sparkling drink is essential to travel sanity, sweetheart. Use this when the humidity starts ruining your blowout."
    },
    {
      category: "Lost & Fabulous",
      english: "I am completely lost, but my outfit is impeccable.",
      translated: "Estoy completamente perdido, pero mi atuendo es impecable.",
      pronunciation: "Ehs-toy kohm-pleh-tah-men-teh pehr-dee-doh, peh-roh mee ah-twen-doh es eem-peh-kah-bleh.",
      insight: "If you're going to wander aimlessly around Barcelona, look like you're doing a photoshoot for Vogue. Locals will guide you just to stay in your light!"
    }
  ],
  French: [
    {
      category: "Diva Survival",
      english: "Excuse me, does this croissant have gluten? I need drama, not bloating.",
      translated: "Excusez-moi, est-ce que ce croissant contient du gluten ? Je veux du drame, pas des ballonnements.",
      pronunciation: "Ex-kew-zay mwah, ess-keh seh krwah-sahn kohn-tyan dew glew-ten? Jheh vuh dew drahm, pah day bah-lohn-mahn.",
      insight: "In Paris, asking about gluten is considered a declarations of war. Say it with your head held high, sweetie!"
    },
    {
      category: "Dining & Drama",
      english: "Another glass of champagne for my emotional support lavender rhino.",
      translated: "Un autre verre de champagne pour mon rhino lavande de soutien émotionnel.",
      pronunciation: "Un oh-treh vehr deh shahm-pahn-yeh poor mohn ree-no lah-vahnd deh soo-tyan ay-moh-syo-nel.",
      insight: "That's me, darling! Champagne is the only fuel that keeps my horn sparkling."
    },
    {
      category: "Fashion & Social",
      english: "Is there a VIP discount? I am a very influential lavender rhinoceros.",
      translated: "Y a-t-il une réduction VIP ? Je suis un rhinocéros lavande très influent.",
      pronunciation: "Ee ah-teel oon ray-dewk-syo vee-ay-pee? Jheh swee oon ree-noh-say-rohs lah-vahnd tray zahn-flew-ahn.",
      insight: "Always ask, gorgeous. The worst they can say is 'Non,' and even that sounds elegant in French."
    }
  ],
  Japanese: [
    {
      category: "Diva Survival",
      english: "Where is the sparkling mimosas section?",
      translated: "スパークリングミモザのコーナーはどこですか？",
      pronunciation: "Supā-kuringu mimoza no kōnā wa doko desu ka?",
      insight: "If a convenience store doesn't have mimosas, we shall create our own with orange juice and high expectations, darling!"
    },
    {
      category: "Dining & Drama",
      english: "This food is so delicious, it makes me want to sing cabaret.",
      translated: "この料理は美味しすぎて、キャバレーを歌いたくなります。",
      pronunciation: "Kono ryōri wa oishisugite, kyabarē wo utaitaku narimasu.",
      insight: "A beautiful compliment in Tokyo! Just make sure not to actually dance on the tatami mats, sweetie."
    }
  ],
  Italian: [
    {
      category: "Diva Survival",
      english: "Could you take a photo of me? Make me look like an Italian cinema legend.",
      translated: "Puoi farmi una foto? Fammi sembrare una leggenda del cinema italiano.",
      pronunciation: "Pwoy fahr-mee oo-nah foh-toh? Fahm-mee sem-brah-reh oo-nah lej-jen-dah del chee-neh-mah ee-tah-lyah-no.",
      insight: "Find a local with a Vespa, pose dramatically, and pretend you're fleeing the paparazzi. Ciao, bella!"
    },
    {
      category: "Dining & Drama",
      english: "No cappuccino after 11 AM? That is a human rights violation!",
      translated: "Niente cappuccino dopo le undici? Questa è una violazione dei diritti umani!",
      pronunciation: "Nyen-teh kahp-poot-chee-no doh-poh leh oon-dee-chee? Kwehs-tah eh oo-nah vyo-lahts-yoh-neh dey dee-reet-tee oo-mah-nee!",
      insight: "It's a serious law of Italian gastronomy, darling. Order an espresso or be prepared for dramatic eye-rolls."
    }
  ]
};
export const SUPPORTED_LANGUAGES = [
  "Spanish", "French", "Japanese", "Italian", "German", "Portuguese", "Thai", "Greek"
];
export const TRAVEL_STYLES = [
  { id: "glamour", name: "Diva Glamour", description: "First-class lounges, high fashion, and endless champagne.", icon: "✨" },
  { id: "chaos", name: "Fabulous Chaos", description: "Spontaneous adventures, funny mishaps, and losing your passport on purpose.", icon: "🌪️" },
  { id: "lounge", name: "Lizard Lounging", description: "Beaches, luxury spas, and avoiding physical movement at all costs.", icon: "🍹" },
  { id: "intellectual", name: "Bougie Art Critic", description: "Obscure museums, dramatic architecture tours, and nodding pretentiously.", icon: "🎨" }
];
export const FUNNY_STICKERS = [
  { id: "send_help", label: "🆘 Send Help & Wine", color: "bg-red-500", text: "Send Wine!" },
  { id: "diva_in_distress", label: "👑 Diva in Distress", color: "bg-pink-500", text: "Diva in Distress" },
  { id: "fabulous_disaster", label: "💅 Fabulous Disaster", color: "bg-purple-500", text: "Fabulous Disaster" },
  { id: "judy_approved", label: "🦏 Judy Approved", color: "bg-indigo-600", text: "Judy Approved" },
  { id: "lost_in_translation", label: "🗺️ Lost in Translation", color: "bg-amber-500", text: "Lost... but Styling!" },
  { id: "total_drama", label: "🎭 Total Drama Queen", color: "bg-rose-600", text: "100% Pure Drama" }
];
