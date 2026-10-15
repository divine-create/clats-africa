import { MeadowLevelConfig, PatternItem } from "../types";

// Reusable item assets with vibrant colors, rounded shapes, and clear tactile labels
const ITEMS: Record<string, PatternItem> = {
  redFirefly: {
    id: "item_red_firefly",
    label: "Red Firefly",
    symbol: "🔴",
    color: "#EF4444",
    shape: "circle",
    category: "firefly"
  },
  blueFirefly: {
    id: "item_blue_firefly",
    label: "Blue Firefly",
    symbol: "🔵",
    color: "#3B82F6",
    shape: "circle",
    category: "firefly"
  },
  greenLeaf: {
    id: "item_green_leaf",
    label: "Green Leaf",
    symbol: "🍃",
    color: "#10B981",
    shape: "circle",
    category: "nature"
  },
  circleStone: {
    id: "item_circle_stone",
    label: "Round Pebble",
    symbol: "🟢",
    color: "#10B981",
    shape: "circle",
    category: "stone"
  },
  squareStone: {
    id: "item_square_stone",
    label: "Square Brick",
    symbol: "🟨",
    color: "#F59E0B",
    shape: "square",
    category: "stone"
  },
  triangleStone: {
    id: "item_triangle_stone",
    label: "Triangle Peak",
    symbol: "🔺",
    color: "#EF4444",
    shape: "triangle",
    category: "stone"
  },
  pinkBlossom: {
    id: "item_pink_blossom",
    label: "Pink Blossom",
    symbol: "🌸",
    color: "#EC4899",
    shape: "circle",
    category: "flower"
  },
  goldenSun: {
    id: "item_golden_sun",
    label: "Golden Sun",
    symbol: "☀️",
    color: "#F59E0B",
    shape: "circle",
    category: "sky"
  },
  waterDrop: {
    id: "item_water_drop",
    label: "Water Drop",
    symbol: "💧",
    color: "#06B6D4",
    shape: "circle",
    category: "water"
  },
  purpleMoon: {
    id: "item_purple_moon",
    label: "Silver Moon",
    symbol: "🌙",
    color: "#8B5CF6",
    shape: "circle",
    category: "sky"
  },
  acorn: {
    id: "item_acorn",
    label: "Acorn",
    symbol: "🌰",
    color: "#D97706",
    shape: "circle",
    category: "forest"
  },
  mushroom: {
    id: "item_mushroom",
    label: "Mushroom",
    symbol: "🍄",
    color: "#EF4444",
    shape: "circle",
    category: "forest"
  },
  fern: {
    id: "item_fern",
    label: "Green Fern",
    symbol: "🌿",
    color: "#059669",
    shape: "circle",
    category: "forest"
  },
  pebble1: {
    id: "item_pebble_1",
    label: "1 Pebble",
    symbol: "🪨",
    color: "#94A3B8",
    size: "sm",
    category: "count"
  },
  pebble2: {
    id: "item_pebble_2",
    label: "2 Pebbles",
    symbol: "🪨🪨",
    color: "#94A3B8",
    size: "md",
    category: "count"
  },
  pebble3: {
    id: "item_pebble_3",
    label: "3 Pebbles",
    symbol: "🪨🪨🪨",
    color: "#94A3B8",
    size: "md",
    category: "count"
  },
  pebble4: {
    id: "item_pebble_4",
    label: "4 Pebbles",
    symbol: "🪨🪨🪨🪨",
    color: "#94A3B8",
    size: "lg",
    category: "count"
  },
  pebble5: {
    id: "item_pebble_5",
    label: "5 Pebbles",
    symbol: "🪨🪨🪨🪨🪨",
    color: "#94A3B8",
    size: "lg",
    category: "count"
  },
  bigRedCircle: {
    id: "item_big_red_circle",
    label: "Big Red Circle",
    symbol: "🔴",
    color: "#EF4444",
    shape: "circle",
    size: "lg",
    category: "shape_color"
  },
  smallBlueSquare: {
    id: "item_small_blue_square",
    label: "Small Blue Square",
    symbol: "🟦",
    color: "#3B82F6",
    shape: "square",
    size: "sm",
    category: "shape_color"
  },
  largeBlueSquare: {
    id: "item_large_blue_square",
    label: "Big Blue Square",
    symbol: "🟦",
    color: "#3B82F6",
    shape: "square",
    size: "lg",
    category: "shape_color"
  },
  smallRedCircle: {
    id: "item_small_red_circle",
    label: "Small Red Circle",
    symbol: "🔴",
    color: "#EF4444",
    shape: "circle",
    size: "sm",
    category: "shape_color"
  }
};

export const MEADOW_LEVELS: MeadowLevelConfig[] = [
  // LEVEL 1: SPOT (AB Color Sequence)
  {
    id: 1,
    title: "Firefly Glade",
    subrule: "Color Alternation (AB · AB)",
    phase: "SPOT",
    mode: "sequence_fill",
    instruction: "Watch the fireflies light up! Tap the firefly that comes next in the rhythm.",
    companionVoicePrompt: "Look at the colorful fireflies! Red, Blue, Red... What color lights up next?",
    preview: {
      type: "color_fireflies",
      title: "Color Alternation",
      explanation: "Patterns repeat like music! When Red is followed by Blue, the next firefly must be Red, then Blue again.",
      demonstrationItems: [ITEMS.redFirefly, ITEMS.blueFirefly, ITEMS.redFirefly, ITEMS.blueFirefly],
      highlightIndex: 3,
      durationSeconds: 4
    },
    sequence: {
      slots: [
        { index: 0, expectedItem: ITEMS.redFirefly, isMissing: false, prefilledItem: ITEMS.redFirefly },
        { index: 1, expectedItem: ITEMS.blueFirefly, isMissing: false, prefilledItem: ITEMS.blueFirefly },
        { index: 2, expectedItem: ITEMS.redFirefly, isMissing: false, prefilledItem: ITEMS.redFirefly },
        { index: 3, expectedItem: ITEMS.blueFirefly, isMissing: true }
      ],
      choices: [ITEMS.greenLeaf, ITEMS.blueFirefly, ITEMS.redFirefly]
    },
    xpAward: 20
  },

  // LEVEL 2: SPOT (AB Shape Sequence)
  {
    id: 2,
    title: "Stepping Stones",
    subrule: "Shape Alternation (Circle · Square)",
    phase: "SPOT",
    mode: "sequence_fill",
    instruction: "Help Kobe cross the stream! Find the missing stepping stone shape.",
    companionVoicePrompt: "Round stone, square stone, round stone... Which shape completes the crossing?",
    preview: {
      type: "shape_stepping_stones",
      title: "Shape Alternation",
      explanation: "Notice the shapes changing one after another: Circle, Square, Circle, Square!",
      demonstrationItems: [ITEMS.circleStone, ITEMS.squareStone, ITEMS.circleStone, ITEMS.squareStone],
      highlightIndex: 3,
      durationSeconds: 4
    },
    sequence: {
      slots: [
        { index: 0, expectedItem: ITEMS.circleStone, isMissing: false, prefilledItem: ITEMS.circleStone },
        { index: 1, expectedItem: ITEMS.squareStone, isMissing: false, prefilledItem: ITEMS.squareStone },
        { index: 2, expectedItem: ITEMS.circleStone, isMissing: false, prefilledItem: ITEMS.circleStone },
        { index: 3, expectedItem: ITEMS.squareStone, isMissing: true }
      ],
      choices: [ITEMS.triangleStone, ITEMS.squareStone, ITEMS.circleStone]
    },
    xpAward: 20
  },

  // LEVEL 3: MATCH (AAB Sequence)
  {
    id: 3,
    title: "Blossom Arch",
    subrule: "Double Repeat (AAB · AAB)",
    phase: "MATCH",
    mode: "sequence_fill",
    instruction: "Flowers bloom in pairs! Find the piece that follows two blossoms.",
    companionVoicePrompt: "Blossom, Blossom, Leaf... Blossom, Blossom... What comes next?",
    preview: {
      type: "blooming_flowers",
      title: "Double-Item Patterns (AAB)",
      explanation: "Sometimes things come in pairs! Two pink blossoms appear, and then one green leaf follows.",
      demonstrationItems: [ITEMS.pinkBlossom, ITEMS.pinkBlossom, ITEMS.greenLeaf, ITEMS.pinkBlossom, ITEMS.pinkBlossom, ITEMS.greenLeaf],
      highlightIndex: 5,
      durationSeconds: 5
    },
    sequence: {
      slots: [
        { index: 0, expectedItem: ITEMS.pinkBlossom, isMissing: false, prefilledItem: ITEMS.pinkBlossom },
        { index: 1, expectedItem: ITEMS.pinkBlossom, isMissing: false, prefilledItem: ITEMS.pinkBlossom },
        { index: 2, expectedItem: ITEMS.greenLeaf, isMissing: false, prefilledItem: ITEMS.greenLeaf },
        { index: 3, expectedItem: ITEMS.pinkBlossom, isMissing: false, prefilledItem: ITEMS.pinkBlossom },
        { index: 4, expectedItem: ITEMS.pinkBlossom, isMissing: false, prefilledItem: ITEMS.pinkBlossom },
        { index: 5, expectedItem: ITEMS.greenLeaf, isMissing: true }
      ],
      choices: [ITEMS.greenLeaf, ITEMS.pinkBlossom, ITEMS.goldenSun]
    },
    xpAward: 20
  },

  // LEVEL 4: MATCH (Middle Gap ABB)
  {
    id: 4,
    title: "Sun & Rain",
    subrule: "Middle Missing Slot (ABB · ABB)",
    phase: "MATCH",
    mode: "sequence_fill",
    instruction: "The weather pattern has a gap in the middle! Tap the tile that fits inside.",
    companionVoicePrompt: "Sun, Rain, Rain! Can you spot what belongs in the missing middle space?",
    preview: {
      type: "river_loop",
      title: "Patterns Can Have Gaps Anywhere",
      explanation: "Even when a missing tile is in the middle, looking before and after helps you solve the puzzle!",
      demonstrationItems: [ITEMS.goldenSun, ITEMS.waterDrop, ITEMS.waterDrop, ITEMS.goldenSun, ITEMS.waterDrop, ITEMS.waterDrop],
      highlightIndex: 2,
      durationSeconds: 5
    },
    sequence: {
      slots: [
        { index: 0, expectedItem: ITEMS.goldenSun, isMissing: false, prefilledItem: ITEMS.goldenSun },
        { index: 1, expectedItem: ITEMS.waterDrop, isMissing: false, prefilledItem: ITEMS.waterDrop },
        { index: 2, expectedItem: ITEMS.waterDrop, isMissing: true },
        { index: 3, expectedItem: ITEMS.goldenSun, isMissing: false, prefilledItem: ITEMS.goldenSun },
        { index: 4, expectedItem: ITEMS.waterDrop, isMissing: false, prefilledItem: ITEMS.waterDrop },
        { index: 5, expectedItem: ITEMS.waterDrop, isMissing: false, prefilledItem: ITEMS.waterDrop }
      ],
      choices: [ITEMS.purpleMoon, ITEMS.waterDrop, ITEMS.goldenSun]
    },
    xpAward: 25
  },

  // LEVEL 5: CLASSIFY (Shape Grouping)
  {
    id: 5,
    title: "Crystal Sorting",
    subrule: "Attribute Classification (Round vs Pointy)",
    phase: "CLASSIFY",
    mode: "category_sort",
    instruction: "Help organize the woodland tray! Drag or tap each stone into its matching basket.",
    companionVoicePrompt: "Sort the objects into two baskets: Round stones in the green basket, Pointy crystals in the red basket!",
    preview: {
      type: "butterfly_grouping",
      title: "Grouping by Attributes",
      explanation: "In AI, computers classify objects by noticing their shapes: round objects go together, and pointy objects go together!",
      demonstrationItems: [ITEMS.circleStone, ITEMS.triangleStone, ITEMS.circleStone, ITEMS.triangleStone],
      durationSeconds: 4
    },
    classification: {
      bins: [
        {
          id: "bin_round",
          name: "Round Stones",
          icon: "🟢",
          color: "#10B981",
          ruleDescription: "Circles with no sharp corners",
          acceptedCategories: ["round"]
        },
        {
          id: "bin_pointy",
          name: "Pointy Peaks",
          icon: "🔺",
          color: "#EF4444",
          ruleDescription: "Triangles with sharp points",
          acceptedCategories: ["pointy"]
        }
      ],
      items: [
        { id: "c1", label: "Round Pebble", symbol: "🟢", color: "#10B981", category: "round" },
        { id: "p1", label: "Triangle Crystal", symbol: "🔺", color: "#EF4444", category: "pointy" },
        { id: "c2", label: "Smooth Stone", symbol: "🟢", color: "#10B981", category: "round" },
        { id: "p2", label: "Sharp Shard", symbol: "🔺", color: "#EF4444", category: "pointy" },
        { id: "c3", label: "Round Emerald", symbol: "🟢", color: "#10B981", category: "round" },
        { id: "p3", label: "Ruby Spike", symbol: "🔺", color: "#EF4444", category: "pointy" }
      ]
    },
    xpAward: 30
  },

  // LEVEL 6: CLASSIFY (Color Temperature)
  {
    id: 6,
    title: "Meadow Harvest",
    subrule: "Color Categorization (Warm vs Cool)",
    phase: "CLASSIFY",
    mode: "category_sort",
    instruction: "Separate the forest harvest into Warm colors (Sun) and Cool colors (Water).",
    companionVoicePrompt: "Put warm colors like reds and yellows into the Sun basket, and cool blues and greens into the River basket!",
    preview: {
      type: "butterfly_grouping",
      title: "Color Classification",
      explanation: "Grouping items by their color family helps smart machines sort foods, recycling, and materials!",
      demonstrationItems: [ITEMS.redFirefly, ITEMS.blueFirefly, ITEMS.goldenSun, ITEMS.waterDrop],
      durationSeconds: 4
    },
    classification: {
      bins: [
        {
          id: "bin_warm",
          name: "Sun Harvest (Warm)",
          icon: "☀️",
          color: "#F59E0B",
          ruleDescription: "Sunny reds, yellows & oranges",
          acceptedCategories: ["warm"]
        },
        {
          id: "bin_cool",
          name: "River Harvest (Cool)",
          icon: "🌊",
          color: "#06B6D4",
          ruleDescription: "Refreshing blues & greens",
          acceptedCategories: ["cool"]
        }
      ],
      items: [
        { id: "w1", label: "Red Berry", symbol: "🍓", color: "#EF4444", category: "warm" },
        { id: "c1", label: "Blueberry", symbol: "🫐", color: "#3B82F6", category: "cool" },
        { id: "w2", label: "Golden Honey", symbol: "🍯", color: "#F59E0B", category: "warm" },
        { id: "c2", label: "Fresh Leaf", symbol: "🍃", color: "#10B981", category: "cool" },
        { id: "w3", label: "Yellow Pear", symbol: "🍐", color: "#EAB308", category: "warm" },
        { id: "c3", label: "Water Lily", symbol: "🪷", color: "#06B6D4", category: "cool" }
      ]
    },
    xpAward: 30
  },

  // LEVEL 7: DISCOVER (ABC Triplet Sequence)
  {
    id: 7,
    title: "Forest Trio",
    subrule: "3-Part Repeating Sequence (ABC · ABC)",
    phase: "DISCOVER",
    mode: "sequence_fill",
    instruction: "Acorn, Mushroom, Fern! Follow the 3-part forest sequence to find the missing item.",
    companionVoicePrompt: "Acorn, Mushroom, Fern... then Acorn, blank, Fern! What came after the Acorn?",
    preview: {
      type: "blooming_flowers",
      title: "3-Part Patterns (ABC)",
      explanation: "Patterns can have three parts! Acorn, Mushroom, Fern... Then the cycle starts all over again with Acorn!",
      demonstrationItems: [ITEMS.acorn, ITEMS.mushroom, ITEMS.fern, ITEMS.acorn, ITEMS.mushroom, ITEMS.fern],
      highlightIndex: 4,
      durationSeconds: 5
    },
    sequence: {
      slots: [
        { index: 0, expectedItem: ITEMS.acorn, isMissing: false, prefilledItem: ITEMS.acorn },
        { index: 1, expectedItem: ITEMS.mushroom, isMissing: false, prefilledItem: ITEMS.mushroom },
        { index: 2, expectedItem: ITEMS.fern, isMissing: false, prefilledItem: ITEMS.fern },
        { index: 3, expectedItem: ITEMS.acorn, isMissing: false, prefilledItem: ITEMS.acorn },
        { index: 4, expectedItem: ITEMS.mushroom, isMissing: true },
        { index: 5, expectedItem: ITEMS.fern, isMissing: false, prefilledItem: ITEMS.fern }
      ],
      choices: [ITEMS.mushroom, ITEMS.acorn, ITEMS.pebble1]
    },
    xpAward: 35
  },

  // LEVEL 8: DISCOVER (Growing Count Pattern)
  {
    id: 8,
    title: "Growing Steps",
    subrule: "Quantitative Growth (+1 Progression)",
    phase: "DISCOVER",
    mode: "sequence_fill",
    instruction: "Count the pebbles on each stone: 1, 2, 3... How many come next?",
    companionVoicePrompt: "The pebble piles keep growing bigger by 1! One, two, three... What is the next number?",
    preview: {
      type: "shape_stepping_stones",
      title: "Growing Patterns",
      explanation: "Some patterns grow step by step! Counting 1, 2, 3 helps smart computers predict what will happen in the future.",
      demonstrationItems: [ITEMS.pebble1, ITEMS.pebble2, ITEMS.pebble3, ITEMS.pebble4],
      highlightIndex: 3,
      durationSeconds: 4
    },
    sequence: {
      slots: [
        { index: 0, expectedItem: ITEMS.pebble1, isMissing: false, prefilledItem: ITEMS.pebble1 },
        { index: 1, expectedItem: ITEMS.pebble2, isMissing: false, prefilledItem: ITEMS.pebble2 },
        { index: 2, expectedItem: ITEMS.pebble3, isMissing: false, prefilledItem: ITEMS.pebble3 },
        { index: 3, expectedItem: ITEMS.pebble4, isMissing: true }
      ],
      choices: [ITEMS.pebble5, ITEMS.pebble4, ITEMS.pebble2]
    },
    xpAward: 35
  },

  // LEVEL 9: APPLY (Multi-Attribute Rule: Size + Shape)
  {
    id: 9,
    title: "Dual Attributes",
    subrule: "Combined Attributes (Size + Shape)",
    phase: "APPLY",
    mode: "sequence_fill",
    instruction: "Look closely at both the size AND the shape! Big Red Circle, Small Blue Square...",
    companionVoicePrompt: "Two rules at once! Big red circle, small blue square, big red circle... What tile has the right size and shape?",
    preview: {
      type: "multi_attribute_gems",
      title: "Combined Attributes",
      explanation: "In real life, AI looks at multiple clues at the same time: both size AND shape change together!",
      demonstrationItems: [ITEMS.bigRedCircle, ITEMS.smallBlueSquare, ITEMS.bigRedCircle, ITEMS.smallBlueSquare],
      highlightIndex: 3,
      durationSeconds: 5
    },
    sequence: {
      slots: [
        { index: 0, expectedItem: ITEMS.bigRedCircle, isMissing: false, prefilledItem: ITEMS.bigRedCircle },
        { index: 1, expectedItem: ITEMS.smallBlueSquare, isMissing: false, prefilledItem: ITEMS.smallBlueSquare },
        { index: 2, expectedItem: ITEMS.bigRedCircle, isMissing: false, prefilledItem: ITEMS.bigRedCircle },
        { index: 3, expectedItem: ITEMS.smallBlueSquare, isMissing: true }
      ],
      choices: [ITEMS.largeBlueSquare, ITEMS.smallBlueSquare, ITEMS.smallRedCircle]
    },
    xpAward: 40
  },

  // LEVEL 10: CREATE (The Great Meadow Archway)
  {
    id: 10,
    title: "The Great Meadow Archway",
    subrule: "Autonomous Pattern Creation (Build your rule)",
    phase: "CREATE",
    mode: "rule_builder",
    instruction: "You are the Pattern Architect! Pick any repeating pattern rule and build 6 stones to unlock the gate!",
    companionVoicePrompt: "You made it to the final Meadow trial! Build your own repeating pattern to awaken the ancient archway!",
    preview: {
      type: "archway_assembly",
      title: "Creating Your Own Pattern",
      explanation: "Now YOU are the creator! Choose your pattern rhythm (like ABAB or AABAAB), place your stones, and watch the archway glow!",
      demonstrationItems: [ITEMS.circleStone, ITEMS.squareStone, ITEMS.circleStone, ITEMS.squareStone, ITEMS.circleStone, ITEMS.squareStone],
      durationSeconds: 5
    },
    creation: {
      targetLength: 6,
      allowedRules: ["AB", "AAB", "ABC"],
      palette: [ITEMS.circleStone, ITEMS.squareStone, ITEMS.triangleStone, ITEMS.pinkBlossom, ITEMS.waterDrop]
    },
    xpAward: 50
  }
];
