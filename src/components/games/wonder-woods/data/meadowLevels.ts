import { MeadowLevelConfig, PatternItem } from "../types";

// Master library of distinct tactile woodland items
export const WOODLAND_ITEMS: Record<string, PatternItem> = {
  // Fireflies (Level 1)
  yellowFirefly: {
    id: "firefly_yellow",
    label: "Yellow Firefly",
    symbol: "🟡",
    color: "#FACC15",
    shape: "firefly",
    category: "firefly"
  },
  blueFirefly: {
    id: "firefly_blue",
    label: "Blue Firefly",
    symbol: "🔵",
    color: "#38BDF8",
    shape: "firefly",
    category: "firefly"
  },
  redFirefly: {
    id: "firefly_red",
    label: "Red Firefly",
    symbol: "🔴",
    color: "#F43F5E",
    shape: "firefly",
    category: "firefly"
  },

  // Geometric Stepping Stones (Level 2 - Neutral stone textures, distinguishable shapes)
  circleSteppingStone: {
    id: "stone_circle",
    label: "Round Stone",
    symbol: "⚪",
    color: "#94A3B8",
    shape: "circle",
    category: "stepping_stone"
  },
  triangleSteppingStone: {
    id: "stone_triangle",
    label: "Triangle Stone",
    symbol: "▲",
    color: "#94A3B8",
    shape: "triangle",
    category: "stepping_stone"
  },
  squareSteppingStone: {
    id: "stone_square",
    label: "Square Stone",
    symbol: "■",
    color: "#94A3B8",
    shape: "square",
    category: "stepping_stone"
  },

  // Woodland Flora (Levels 3, 4, 6)
  pinkFlower: {
    id: "flora_flower_pink",
    label: "Pink Flower",
    symbol: "🌸",
    color: "#EC4899",
    shape: "flower",
    category: "flora"
  },
  greenLeaf: {
    id: "flora_leaf_green",
    label: "Green Leaf",
    symbol: "🍃",
    color: "#10B981",
    shape: "leaf",
    category: "flora"
  },
  blueFlower: {
    id: "flora_flower_blue",
    label: "Blue Flower",
    symbol: "🪻",
    color: "#6366F1",
    shape: "flower",
    category: "flora"
  },
  sunflower: {
    id: "flora_sunflower",
    label: "Sunflower",
    symbol: "🌻",
    color: "#F59E0B",
    shape: "flower",
    category: "flora"
  },

  // Mushrooms of Different Sizes (Level 5)
  bigMushroom: {
    id: "shroom_big",
    label: "Big Mushroom",
    symbol: "🍄",
    color: "#EF4444",
    shape: "mushroom",
    size: "lg",
    category: "size_shroom"
  },
  smallMushroom: {
    id: "shroom_small",
    label: "Small Mushroom",
    symbol: "🍄",
    color: "#EF4444",
    shape: "mushroom",
    size: "sm",
    category: "size_shroom"
  },
  tinyMushroom: {
    id: "shroom_tiny",
    label: "Tiny Sprout",
    symbol: "🌱",
    color: "#10B981",
    size: "sm",
    category: "size_shroom"
  },

  // Woodland Trio (Level 6)
  forestMushroom: {
    id: "trio_shroom",
    label: "Red Mushroom",
    symbol: "🍄",
    color: "#EF4444",
    category: "woodland_trio"
  },
  forestFlower: {
    id: "trio_flower",
    label: "Meadow Flower",
    symbol: "🌸",
    color: "#EC4899",
    category: "woodland_trio"
  },
  forestLeaf: {
    id: "trio_leaf",
    label: "Oak Leaf",
    symbol: "🍃",
    color: "#10B981",
    category: "woodland_trio"
  },
  forestAcorn: {
    id: "trio_acorn",
    label: "Oak Acorn",
    symbol: "🌰",
    color: "#D97706",
    category: "woodland_trio"
  },

  // Multi-Attribute Bridge Tiles (Level 7)
  redCircleTile: {
    id: "tile_red_circle",
    label: "Red Circle",
    symbol: "🔴",
    color: "#EF4444",
    shape: "circle",
    category: "multi_attr"
  },
  blueTriangleTile: {
    id: "tile_blue_triangle",
    label: "Blue Triangle",
    symbol: "▲",
    color: "#3B82F6",
    shape: "triangle",
    category: "multi_attr"
  },
  redTriangleTile: {
    id: "tile_red_triangle",
    label: "Red Triangle",
    symbol: "▲",
    color: "#EF4444",
    shape: "triangle",
    category: "multi_attr"
  },
  blueCircleTile: {
    id: "tile_blue_circle",
    label: "Blue Circle",
    symbol: "🔴",
    color: "#3B82F6",
    shape: "circle",
    category: "multi_attr"
  },

  // Detective Board Symbols (Level 8)
  sunBoardItem: {
    id: "board_sun",
    label: "Golden Sun",
    symbol: "☀️",
    color: "#F59E0B",
    category: "celestial"
  },
  moonBoardItem: {
    id: "board_moon",
    label: "Crescent Moon",
    symbol: "🌙",
    color: "#8B5CF6",
    category: "celestial"
  },

  // Intruder Trail Items (Level 9)
  grayPebble: {
    id: "intruder_pebble",
    label: "Gray Pebble",
    symbol: "🪨",
    color: "#64748B",
    category: "rock"
  },

  // Level 10 Trial Items
  amberSunRune: {
    id: "rune_amber_sun",
    label: "Amber Sun",
    symbol: "🟡",
    color: "#F59E0B",
    shape: "circle",
    category: "gate_rune"
  },
  emeraldLeafRune: {
    id: "rune_emerald_leaf",
    label: "Emerald Leaf",
    symbol: "🟢",
    color: "#10B981",
    shape: "circle",
    category: "gate_rune"
  },
  sapphireGemRune: {
    id: "rune_sapphire_gem",
    label: "Sapphire Gem",
    symbol: "💎",
    color: "#38BDF8",
    shape: "diamond",
    category: "gate_rune"
  }
};

export const MEADOW_LEVELS: MeadowLevelConfig[] = [
  // -------------------------------------------------------------
  // LEVEL 1 — Firefly Follow-the-Light
  // -------------------------------------------------------------
  {
    id: 1,
    title: "Firefly Follow-the-Light",
    subrule: "Color Alternation (AB · AB)",
    phase: "SPOT",
    mode: "sequence_fill",
    instruction: "Which firefly comes next? Look closely at the rhythm of the glowing lights.",
    companionVoicePrompt: "Look at the glowing meadow! Yellow light, blue light, yellow light, blue light... What firefly comes next?",
    hintLevel1: "Good try — let's look at the pattern again.",
    hintLevel2: "Look at the colours. What happens after the yellow light?",
    successExplanation: "You found the AB rule: yellow and blue fireflies take turns shining!",
    preview: {
      type: "color_fireflies",
      title: "Firefly Follow-the-Light",
      explanation: "Fireflies pulse with a repeating rhythm: Yellow lights up, then Blue, then Yellow, then Blue!",
      demonstrationItems: [
        WOODLAND_ITEMS.yellowFirefly,
        WOODLAND_ITEMS.blueFirefly,
        WOODLAND_ITEMS.yellowFirefly,
        WOODLAND_ITEMS.blueFirefly
      ],
      highlightIndex: 3,
      durationSeconds: 4
    },
    sequence: {
      slots: [
        { index: 0, expectedItem: WOODLAND_ITEMS.yellowFirefly, isMissing: false, prefilledItem: WOODLAND_ITEMS.yellowFirefly },
        { index: 1, expectedItem: WOODLAND_ITEMS.blueFirefly, isMissing: false, prefilledItem: WOODLAND_ITEMS.blueFirefly },
        { index: 2, expectedItem: WOODLAND_ITEMS.yellowFirefly, isMissing: false, prefilledItem: WOODLAND_ITEMS.yellowFirefly },
        { index: 3, expectedItem: WOODLAND_ITEMS.blueFirefly, isMissing: false, prefilledItem: WOODLAND_ITEMS.blueFirefly },
        { index: 4, expectedItem: WOODLAND_ITEMS.yellowFirefly, isMissing: true }
      ],
      choices: [
        WOODLAND_ITEMS.redFirefly,
        WOODLAND_ITEMS.yellowFirefly,
        WOODLAND_ITEMS.blueFirefly,
        WOODLAND_ITEMS.greenLeaf
      ]
    },
    xpAward: 20
  },

  // -------------------------------------------------------------
  // LEVEL 2 — Stepping-Stone Shapes
  // -------------------------------------------------------------
  {
    id: 2,
    title: "Stepping-Stone Shapes",
    subrule: "Shape Alternation (Circle · Triangle)",
    phase: "SPOT",
    mode: "sequence_fill",
    instruction: "Help cross the stream! Find the missing shape stone to make the crossing safe.",
    companionVoicePrompt: "Look at the stream stones! Round circle stone, triangle stone, round circle stone... Which shape comes next?",
    hintLevel1: "Check the shapes carefully along the stream.",
    hintLevel2: "Look at the shapes, not just their colours.",
    successExplanation: "Splash! Circle, Triangle, Circle, Triangle! The stepping stones are balanced.",
    preview: {
      type: "shape_stepping_stones",
      title: "Stepping-Stone Shapes",
      explanation: "Focus on geometry: Circle stone, Triangle stone, Circle stone, Triangle stone!",
      demonstrationItems: [
        WOODLAND_ITEMS.circleSteppingStone,
        WOODLAND_ITEMS.triangleSteppingStone,
        WOODLAND_ITEMS.circleSteppingStone,
        WOODLAND_ITEMS.triangleSteppingStone
      ],
      highlightIndex: 3,
      durationSeconds: 4
    },
    sequence: {
      slots: [
        { index: 0, expectedItem: WOODLAND_ITEMS.circleSteppingStone, isMissing: false, prefilledItem: WOODLAND_ITEMS.circleSteppingStone },
        { index: 1, expectedItem: WOODLAND_ITEMS.triangleSteppingStone, isMissing: false, prefilledItem: WOODLAND_ITEMS.triangleSteppingStone },
        { index: 2, expectedItem: WOODLAND_ITEMS.circleSteppingStone, isMissing: false, prefilledItem: WOODLAND_ITEMS.circleSteppingStone },
        { index: 3, expectedItem: WOODLAND_ITEMS.triangleSteppingStone, isMissing: true }
      ],
      choices: [
        WOODLAND_ITEMS.squareSteppingStone,
        WOODLAND_ITEMS.triangleSteppingStone,
        WOODLAND_ITEMS.circleSteppingStone
      ]
    },
    xpAward: 20
  },

  // -------------------------------------------------------------
  // LEVEL 3 — The Blooming Garden
  // -------------------------------------------------------------
  {
    id: 3,
    title: "The Blooming Garden",
    subrule: "Object Alternation (Flower · Leaf)",
    phase: "MATCH",
    mode: "sequence_fill",
    instruction: "Complete the woodland garden trail! Find the missing plant piece.",
    companionVoicePrompt: "Flower, Leaf, Flower, blank, Flower, Leaf! Which botanical friend fills the gap?",
    hintLevel1: "Good effort — examine what comes right before the empty slot.",
    hintLevel2: "Which two things keep taking turns?",
    successExplanation: "The woodland garden bursts with blooms! Flower, Leaf, Flower, Leaf!",
    preview: {
      type: "blooming_flowers",
      title: "The Blooming Garden",
      explanation: "A flower blooms, then a fresh leaf unfurls, then a flower blooms again!",
      demonstrationItems: [
        WOODLAND_ITEMS.pinkFlower,
        WOODLAND_ITEMS.greenLeaf,
        WOODLAND_ITEMS.pinkFlower,
        WOODLAND_ITEMS.greenLeaf
      ],
      highlightIndex: 2,
      durationSeconds: 4
    },
    sequence: {
      slots: [
        { index: 0, expectedItem: WOODLAND_ITEMS.pinkFlower, isMissing: false, prefilledItem: WOODLAND_ITEMS.pinkFlower },
        { index: 1, expectedItem: WOODLAND_ITEMS.greenLeaf, isMissing: false, prefilledItem: WOODLAND_ITEMS.greenLeaf },
        { index: 2, expectedItem: WOODLAND_ITEMS.pinkFlower, isMissing: false, prefilledItem: WOODLAND_ITEMS.pinkFlower },
        { index: 3, expectedItem: WOODLAND_ITEMS.greenLeaf, isMissing: true },
        { index: 4, expectedItem: WOODLAND_ITEMS.pinkFlower, isMissing: false, prefilledItem: WOODLAND_ITEMS.pinkFlower },
        { index: 5, expectedItem: WOODLAND_ITEMS.greenLeaf, isMissing: false, prefilledItem: WOODLAND_ITEMS.greenLeaf }
      ],
      choices: [
        WOODLAND_ITEMS.sunflower,
        WOODLAND_ITEMS.greenLeaf,
        WOODLAND_ITEMS.pinkFlower
      ]
    },
    xpAward: 25
  },

  // -------------------------------------------------------------
  // LEVEL 4 — Double-Bloom Trail
  // -------------------------------------------------------------
  {
    id: 4,
    title: "Double-Bloom Trail",
    subrule: "Double Repeat (AAB · AAB)",
    phase: "MATCH",
    mode: "sequence_fill",
    instruction: "Flowers bloom in double clusters! Identify what finishes the double-bloom unit.",
    companionVoicePrompt: "Two pink flowers, one blue flower... Two pink flowers, then what?",
    hintLevel1: "Take your time — look at how many pink flowers bloom side by side.",
    hintLevel2: "Look carefully. Does each object appear once, or do some repeat before the next one?",
    successExplanation: "Double bloom mastered! Pink, Pink, Blue! That's an AAB repeating unit.",
    preview: {
      type: "blooming_flowers",
      title: "Double-Bloom Trail",
      explanation: "Notice the pair: Two pink flowers bloom together, then one blue flower follows!",
      demonstrationItems: [
        WOODLAND_ITEMS.pinkFlower,
        WOODLAND_ITEMS.pinkFlower,
        WOODLAND_ITEMS.blueFlower,
        WOODLAND_ITEMS.pinkFlower,
        WOODLAND_ITEMS.pinkFlower,
        WOODLAND_ITEMS.blueFlower
      ],
      highlightIndex: 5,
      durationSeconds: 5
    },
    sequence: {
      slots: [
        { index: 0, expectedItem: WOODLAND_ITEMS.pinkFlower, isMissing: false, prefilledItem: WOODLAND_ITEMS.pinkFlower },
        { index: 1, expectedItem: WOODLAND_ITEMS.pinkFlower, isMissing: false, prefilledItem: WOODLAND_ITEMS.pinkFlower },
        { index: 2, expectedItem: WOODLAND_ITEMS.blueFlower, isMissing: false, prefilledItem: WOODLAND_ITEMS.blueFlower },
        { index: 3, expectedItem: WOODLAND_ITEMS.pinkFlower, isMissing: false, prefilledItem: WOODLAND_ITEMS.pinkFlower },
        { index: 4, expectedItem: WOODLAND_ITEMS.pinkFlower, isMissing: false, prefilledItem: WOODLAND_ITEMS.pinkFlower },
        { index: 5, expectedItem: WOODLAND_ITEMS.blueFlower, isMissing: true }
      ],
      choices: [
        WOODLAND_ITEMS.pinkFlower,
        WOODLAND_ITEMS.blueFlower,
        WOODLAND_ITEMS.greenLeaf
      ]
    },
    xpAward: 25
  },

  // -------------------------------------------------------------
  // LEVEL 5 — Big and Small
  // -------------------------------------------------------------
  {
    id: 5,
    title: "Big and Small",
    subrule: "Size Pattern (Big · Small)",
    phase: "CLASSIFY",
    mode: "sequence_fill",
    instruction: "Look at the mushroom sizes! Find the mushroom with the right scale.",
    companionVoicePrompt: "Big mushroom, small mushroom, big mushroom... Which mushroom size fits next?",
    hintLevel1: "Check the scale and height of each mushroom carefully.",
    hintLevel2: "Look at how big each mushroom is. Big, small, big...",
    successExplanation: "Scale solved! Big mushroom, small mushroom! In computer vision, detecting size changes is a vital AI skill.",
    preview: {
      type: "size_growth",
      title: "Size Patterns",
      explanation: "The colours are the same, but the size changes rhythmically: Big, Small, Big, Small!",
      demonstrationItems: [
        WOODLAND_ITEMS.bigMushroom,
        WOODLAND_ITEMS.smallMushroom,
        WOODLAND_ITEMS.bigMushroom,
        WOODLAND_ITEMS.smallMushroom
      ],
      highlightIndex: 3,
      durationSeconds: 4
    },
    sequence: {
      slots: [
        { index: 0, expectedItem: WOODLAND_ITEMS.bigMushroom, isMissing: false, prefilledItem: WOODLAND_ITEMS.bigMushroom },
        { index: 1, expectedItem: WOODLAND_ITEMS.smallMushroom, isMissing: false, prefilledItem: WOODLAND_ITEMS.smallMushroom },
        { index: 2, expectedItem: WOODLAND_ITEMS.bigMushroom, isMissing: false, prefilledItem: WOODLAND_ITEMS.bigMushroom },
        { index: 3, expectedItem: WOODLAND_ITEMS.smallMushroom, isMissing: true }
      ],
      choices: [
        WOODLAND_ITEMS.tinyMushroom,
        WOODLAND_ITEMS.smallMushroom,
        WOODLAND_ITEMS.bigMushroom
      ]
    },
    xpAward: 30
  },

  // -------------------------------------------------------------
  // LEVEL 6 — The Triple-Rhythm Path
  // -------------------------------------------------------------
  {
    id: 6,
    title: "The Triple-Rhythm Path",
    subrule: "3-Part Repeating Sequence (ABC · ABC)",
    phase: "DISCOVER",
    mode: "sequence_fill",
    instruction: "Mushroom, Flower, Leaf! Find the missing middle piece in the second triplet.",
    companionVoicePrompt: "Mushroom, Flower, Leaf... then Mushroom, blank, Leaf! What came between Mushroom and Leaf?",
    hintLevel1: "Look at the three woodland friends in each group.",
    hintLevel2: "This pattern has three parts before it starts again.",
    successExplanation: "Triple rhythm confirmed! Mushroom, Flower, Leaf! All three parts loop together in harmony.",
    preview: {
      type: "blooming_flowers",
      title: "The Triple-Rhythm Path",
      explanation: "Three distinct objects repeat in order: Mushroom, then Flower, then Leaf!",
      demonstrationItems: [
        WOODLAND_ITEMS.forestMushroom,
        WOODLAND_ITEMS.forestFlower,
        WOODLAND_ITEMS.forestLeaf,
        WOODLAND_ITEMS.forestMushroom,
        WOODLAND_ITEMS.forestFlower,
        WOODLAND_ITEMS.forestLeaf
      ],
      highlightIndex: 4,
      durationSeconds: 5
    },
    sequence: {
      slots: [
        { index: 0, expectedItem: WOODLAND_ITEMS.forestMushroom, isMissing: false, prefilledItem: WOODLAND_ITEMS.forestMushroom },
        { index: 1, expectedItem: WOODLAND_ITEMS.forestFlower, isMissing: false, prefilledItem: WOODLAND_ITEMS.forestFlower },
        { index: 2, expectedItem: WOODLAND_ITEMS.forestLeaf, isMissing: false, prefilledItem: WOODLAND_ITEMS.forestLeaf },
        { index: 3, expectedItem: WOODLAND_ITEMS.forestMushroom, isMissing: false, prefilledItem: WOODLAND_ITEMS.forestMushroom },
        { index: 4, expectedItem: WOODLAND_ITEMS.forestFlower, isMissing: true },
        { index: 5, expectedItem: WOODLAND_ITEMS.forestLeaf, isMissing: false, prefilledItem: WOODLAND_ITEMS.forestLeaf }
      ],
      choices: [
        WOODLAND_ITEMS.forestAcorn,
        WOODLAND_ITEMS.forestFlower,
        WOODLAND_ITEMS.forestMushroom
      ]
    },
    xpAward: 30
  },

  // -------------------------------------------------------------
  // LEVEL 7 — Colour and Shape Detectives
  // -------------------------------------------------------------
  {
    id: 7,
    title: "Colour and Shape Detectives",
    subrule: "Combined Attributes (Color + Shape)",
    phase: "APPLY",
    mode: "sequence_fill",
    instruction: "Check BOTH clues! Red Circle, Blue Triangle, Red Circle... Which tile matches both attributes?",
    companionVoicePrompt: "Look at both the color AND the shape! Red circle, blue triangle, red circle... What tile has the right shape and color?",
    hintLevel1: "Remember, both clues matter: check the color AND the shape.",
    hintLevel2: "Check the shape and the colour together. Red circle, then Blue triangle!",
    successExplanation: "Dual Detective mastery! Red Circle, Blue Triangle! You tested both color and shape simultaneously.",
    preview: {
      type: "multi_attribute_gems",
      title: "Colour and Shape Detectives",
      explanation: "In smart AI systems, machines evaluate multiple features together: Color AND Shape!",
      demonstrationItems: [
        WOODLAND_ITEMS.redCircleTile,
        WOODLAND_ITEMS.blueTriangleTile,
        WOODLAND_ITEMS.redCircleTile,
        WOODLAND_ITEMS.blueTriangleTile
      ],
      highlightIndex: 3,
      durationSeconds: 5
    },
    sequence: {
      slots: [
        { index: 0, expectedItem: WOODLAND_ITEMS.redCircleTile, isMissing: false, prefilledItem: WOODLAND_ITEMS.redCircleTile },
        { index: 1, expectedItem: WOODLAND_ITEMS.blueTriangleTile, isMissing: false, prefilledItem: WOODLAND_ITEMS.blueTriangleTile },
        { index: 2, expectedItem: WOODLAND_ITEMS.redCircleTile, isMissing: false, prefilledItem: WOODLAND_ITEMS.redCircleTile },
        { index: 3, expectedItem: WOODLAND_ITEMS.blueTriangleTile, isMissing: true }
      ],
      choices: [
        WOODLAND_ITEMS.redTriangleTile,   // Trap: Right shape, wrong color
        WOODLAND_ITEMS.blueTriangleTile,  // Correct!
        WOODLAND_ITEMS.blueCircleTile     // Trap: Right color, wrong shape
      ]
    },
    xpAward: 35
  },

  // -------------------------------------------------------------
  // LEVEL 8 — Find the Pattern Rule
  // -------------------------------------------------------------
  {
    id: 8,
    title: "Find the Pattern Rule",
    subrule: "Rule Induction & Description",
    phase: "DISCOVER",
    mode: "rule_selection",
    instruction: "Look at the detective board. Which rule correctly explains this pattern?",
    companionVoicePrompt: "Examine the board closely. Can you find the secret rule that explains this rhythm?",
    hintLevel1: "Observe what stays the same and what repeats.",
    hintLevel2: "What stays the same each time? What changes? Sun, Moon, Sun, Moon...",
    successExplanation: "Rule induced! You recognized the core rule behind the pattern, just like an AI data scientist!",
    preview: {
      type: "color_fireflies",
      title: "Find the Pattern Rule",
      explanation: "Discovering the underlying rule allows AI to predict what will happen next forever!",
      demonstrationItems: [
        WOODLAND_ITEMS.sunBoardItem,
        WOODLAND_ITEMS.moonBoardItem,
        WOODLAND_ITEMS.sunBoardItem,
        WOODLAND_ITEMS.moonBoardItem
      ],
      durationSeconds: 4
    },
    ruleSelection: {
      visualSequence: [
        WOODLAND_ITEMS.sunBoardItem,
        WOODLAND_ITEMS.moonBoardItem,
        WOODLAND_ITEMS.sunBoardItem,
        WOODLAND_ITEMS.moonBoardItem,
        WOODLAND_ITEMS.sunBoardItem,
        WOODLAND_ITEMS.moonBoardItem
      ],
      options: [
        {
          id: "rule_alt_celestial",
          text: "Alternating Pattern: Sun and Moon take turns (AB · AB)",
          isCorrect: true,
          explanation: "Correct! The Golden Sun and Silver Moon alternate back and forth predictably."
        },
        {
          id: "rule_growing",
          text: "Growing Pattern: The objects get bigger each time",
          isCorrect: false,
          explanation: "Look closely: the sizes do not grow; they stay the same size."
        },
        {
          id: "rule_triplet",
          text: "Triplet Pattern: Sun, Moon, Star loop together",
          isCorrect: false,
          explanation: "There are only 2 objects (Sun and Moon), not 3."
        }
      ]
    },
    xpAward: 35
  },

  // -------------------------------------------------------------
  // LEVEL 9 — The Sneaky Intruder
  // -------------------------------------------------------------
  {
    id: 9,
    title: "The Sneaky Intruder",
    subrule: "Anomaly Detection & Repair",
    phase: "APPLY",
    mode: "odd_one_out",
    instruction: "A sneaky intruder broke the flower trail! Tap the intruder, then choose the right replacement.",
    companionVoicePrompt: "Most of these plants follow the Flower-Leaf rhythm. Which object does something different?",
    hintLevel1: "Scan the trail from left to right. One object doesn't belong.",
    hintLevel2: "Most of these follow one rule. Which one does something different?",
    successExplanation: "Anomaly detected and repaired! The gray rock broke the rhythm. You restored the woodland trail!",
    preview: {
      type: "odd_one_out_highlight",
      title: "The Sneaky Intruder",
      explanation: "In cybersecurity and AI, spotting anomalies means finding the one item that breaks the rule!",
      demonstrationItems: [
        WOODLAND_ITEMS.pinkFlower,
        WOODLAND_ITEMS.greenLeaf,
        WOODLAND_ITEMS.pinkFlower,
        WOODLAND_ITEMS.grayPebble,
        WOODLAND_ITEMS.pinkFlower,
        WOODLAND_ITEMS.greenLeaf
      ],
      highlightIndex: 3,
      durationSeconds: 5
    },
    oddOneOut: {
      items: [
        WOODLAND_ITEMS.pinkFlower,
        WOODLAND_ITEMS.greenLeaf,
        WOODLAND_ITEMS.pinkFlower,
        WOODLAND_ITEMS.grayPebble, // Intruder at index 3
        WOODLAND_ITEMS.pinkFlower,
        WOODLAND_ITEMS.greenLeaf
      ],
      intruderIndex: 3,
      correctReplacement: WOODLAND_ITEMS.greenLeaf,
      replacementChoices: [
        WOODLAND_ITEMS.greenLeaf,
        WOODLAND_ITEMS.sunflower,
        WOODLAND_ITEMS.grayPebble
      ]
    },
    xpAward: 40
  },

  // -------------------------------------------------------------
  // LEVEL 10 — The Pattern Keeper's Trial
  // -------------------------------------------------------------
  {
    id: 10,
    title: "The Pattern Keeper's Trial",
    subrule: "Mixed Solve + Pattern Creator Archway",
    phase: "CREATE",
    mode: "trial_hybrid",
    instruction: "Solve the Gate Lock, then construct your own 6-piece repeating pattern to unlock Wonder Woods!",
    companionVoicePrompt: "You made it to the final Meadow trial! Solve the gate lock, then build your own pattern to open the portal!",
    hintLevel1: "Find the rule for the gate lock first.",
    hintLevel2: "Find the rule first. Then use it to build your own pattern.",
    successExplanation: "THE ANCIENT GATE OPENS! The Pattern Keeper salutes your brilliance! Wonder Woods is now UNLOCKED!",
    preview: {
      type: "archway_assembly",
      title: "The Pattern Keeper's Trial",
      explanation: "First solve the gate code, then become the Pattern Architect and build your own repeating sequence!",
      demonstrationItems: [
        WOODLAND_ITEMS.amberSunRune,
        WOODLAND_ITEMS.emeraldLeafRune,
        WOODLAND_ITEMS.amberSunRune,
        WOODLAND_ITEMS.emeraldLeafRune
      ],
      highlightIndex: 3,
      durationSeconds: 5
    },
    trialHybrid: {
      step1Slots: [
        { index: 0, expectedItem: WOODLAND_ITEMS.amberSunRune, isMissing: false, prefilledItem: WOODLAND_ITEMS.amberSunRune },
        { index: 1, expectedItem: WOODLAND_ITEMS.emeraldLeafRune, isMissing: false, prefilledItem: WOODLAND_ITEMS.emeraldLeafRune },
        { index: 2, expectedItem: WOODLAND_ITEMS.amberSunRune, isMissing: false, prefilledItem: WOODLAND_ITEMS.amberSunRune },
        { index: 3, expectedItem: WOODLAND_ITEMS.emeraldLeafRune, isMissing: true }
      ],
      step1Choices: [
        WOODLAND_ITEMS.sapphireGemRune,
        WOODLAND_ITEMS.emeraldLeafRune,
        WOODLAND_ITEMS.amberSunRune
      ],
      step2TargetLength: 6,
      step2Palette: [
        WOODLAND_ITEMS.amberSunRune,
        WOODLAND_ITEMS.emeraldLeafRune,
        WOODLAND_ITEMS.sapphireGemRune
      ]
    },
    xpAward: 50
  }
];
