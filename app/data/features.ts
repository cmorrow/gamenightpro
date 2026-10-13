// Copy for the public Features page and the landing page. Edit wording here, not in the pages.
// `status: 'soon'` shows a "Coming soon" badge until a game module ships.

export interface Feature {
  title: string;
  body: string;
  isNew?: boolean;
}
export interface GameFeatures {
  id: string;
  name: string;
  icon: "music" | "grid" | "trivia";
  status: "live" | "soon";
  pitch: string;
  features: Feature[];
}

export const games: GameFeatures[] = [
  {
    id: "music-bingo",
    name: "Music Bingo",
    icon: "music",
    status: "live",
    pitch:
      "Players mark song titles instead of numbers. Build cards from any playlist and play the music from the player you already use.",
    features: [
      {
        title: "Import from Spotify and YouTube",
        body: "Paste a playlist link and get a game-ready song list in seconds. Or start from 24 curated playlists: 70s, 80s, 90s, Motown, one-hit wonders and more.",
      },
      {
        title: "Clean titles without losing the source",
        body: 'Strip "Remastered 2009" and "(Live)" in bulk. Your edits survive a re-import, so the playlist stays tidy.',
        isNew: true,
      },
      {
        title: "Printable cards, every one unique",
        body: "Generate hundreds of duplicate-free cards as a print-ready PDF, in 4×4 or 5×5 grids, with your logo and colors.",
      },
      {
        title: "Any win pattern",
        body: "Lines, corners, X, blackout or your own pattern, shown as a diagram so players know what they need.",
      },
      {
        title: "Audience screen",
        body: "Put called songs, the pattern and album art on a TV or projector while you run the game from your laptop.",
      },
      {
        title: "Verify winners fast",
        body: 'When someone shouts "Bingo!", verify the card against the songs already played in a couple of taps.',
      },
      {
        title: "Bring your own music",
        body: "Play songs from Spotify, Apple Music or a DJ deck. No in-app playback limits or extra streaming licenses to manage.",
      },
    ],
  },
  {
    id: "bingo",
    name: "Bingo",
    icon: "grid",
    status: "soon",
    pitch:
      "Classic 75-ball and 90-ball bingo with a caller that never loses its place.",
    features: [
      {
        title: "75-ball and 90-ball games",
        body: "US and UK formats, with standard and custom patterns for every round.",
      },
      {
        title: "Big, readable caller board",
        body: "The audience screen shows the last ball, the full board and the current pattern, sized for the back of the room.",
      },
      {
        title: "Printable and reusable cards",
        body: "Print numbered card packs once and reuse them at every event. Card numbers verify a winner in one step.",
      },
      {
        title: "Auto or manual calling",
        body: "Draw balls with a click, on a timer, or enter them from a physical cage.",
      },
      {
        title: "Themed bingo",
        body: "Swap numbers for words, pictures or brand terms for holidays, fundraisers and corporate events.",
        isNew: true,
      },
      {
        title: "Prize rounds",
        body: "Plan a night of rounds with a different pattern and prize for each, then run them in order.",
      },
    ],
  },
  {
    id: "trivia",
    name: "Trivia",
    icon: "trivia",
    status: "soon",
    pitch:
      "Pub-quiz style trivia with rounds, teams and a live leaderboard, on paper or on players' phones.",
    features: [
      {
        title: "Round builder",
        body: "Mix multiple choice, open answer, picture and music rounds. Reuse questions across events.",
      },
      {
        title: "Phone or paper answers",
        body: "Teams join with a code and answer on their phones, or use paper sheets you mark in the app.",
      },
      {
        title: "Live leaderboard",
        body: "Scores update on the audience screen between rounds, with tie-breakers built in.",
      },
      {
        title: "Music rounds from your playlists",
        body: 'Turn any Music Bingo playlist into a "name that tune" round in one click.',
        isNew: true,
      },
      {
        title: "Question bank",
        body: "Start from ready-made packs by topic and difficulty, then add your own.",
      },
      {
        title: "Fair-play controls",
        body: "Timed questions, locked answers and late-answer flags keep scoring honest.",
      },
    ],
  },
];

// What sets the platform apart. Shown on both the landing and features pages.
export const differentiators: (Feature & {
  icon: "wifiOff" | "layers" | "tag" | "monitor" | "printer" | "shield";
})[] = [
  {
    icon: "wifiOff",
    title: "Works when the Wi-Fi doesn't",
    body: 'Prepare at home, then run the whole event offline. A "Ready for offline" badge tells you before you leave.',
  },
  {
    icon: "layers",
    title: "Everything in one place",
    body: "Build Music Bingo games, prepare printable cards and run an audience screen from one tool.",
  },
  {
    icon: "tag",
    title: "One simple monthly price",
    body: "$14.99/month for unlimited events, players and printable cards. No caps, per-player fees or overages.",
  },
  {
    icon: "monitor",
    title: "Any screen is the big screen",
    body: "Open the audience view on a second tab, a TV or a projector. No app install for you or your players.",
  },
  {
    icon: "printer",
    title: "Print-first, phone-friendly",
    body: "Paper cards for crowds who want them, phones for those who don't. Both in the same game.",
  },
  {
    icon: "shield",
    title: "Your games stay yours",
    body: "Playlists, questions and branding are private to your account and exportable anytime.",
  },
];
