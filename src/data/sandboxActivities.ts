/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * CLATS Young Explorers (Ages 6–10): Practice Sandbox Activity Library
 *
 * Organized strictly around the verified curriculum hierarchy:
 * Learning Pathway (Adventure) -> Module -> Lesson -> Practice Activity
 */

import { recordLearningEvent } from "../utils/learningEvidence";

export type SandboxEngineType =
  | "sorting-buckets"
  | "device-matcher"
  | "sequence-builder"
  | "pattern-builder"
  | "digital-canvas"
  | "sound-pad"
  | "scenario-simulator";

export interface SortingBucketsConfig {
  bucketA: { id: "A"; label: string; emoji: string; color: string };
  bucketB: { id: "B"; label: string; emoji: string; color: string };
  items: {
    id: string;
    label: string;
    emoji: string;
    correctBucket: "A" | "B";
    hint: string;
  }[];
}

export interface DeviceMatcherConfig {
  promptLabel: string;
  targetLabel: string;
  pairs: {
    id: string;
    leftLabel: string;
    leftEmoji: string;
    rightLabel: string;
    rightEmoji: string;
    simulationReaction: string;
  }[];
}

export interface SequenceBuilderConfig {
  goalText: string;
  steps: {
    id: string;
    order: number; // 1-based correct position
    label: string;
    emoji: string;
    detail: string;
  }[];
}

export interface PatternBuilderConfig {
  rounds: {
    id: string;
    prompt: string;
    sequence: { label: string; emoji: string }[];
    options: { label: string; emoji: string; isCorrect: boolean }[];
    explanation: string;
  }[];
}

export interface DigitalCanvasConfig {
  prompt: string;
  requiredShapesCount: number;
  requiredColorsCount: number;
  starterPrompts: string[];
  palette: { name: string; hex: string }[];
  stamps: { id: string; label: string; emoji: string }[];
}

export interface SoundPadConfig {
  prompt: string;
  targetBeatsCount: number;
  pads: {
    id: string;
    label: string;
    emoji: string;
    freq: number;
    wave: "sine" | "triangle";
    color: string;
  }[];
}

export interface ScenarioSimulatorConfig {
  scenarios: {
    id: string;
    situation: string;
    emoji: string;
    choices: {
      id: string;
      text: string;
      emoji: string;
      isSafeOrWise: boolean;
      consequence: string;
    }[];
  }[];
}

export interface SandboxActivity {
  id: string;
  adventureId: "academy-1" | "academy-2" | "academy-3" | "academy-4";
  adventureNumber: 1 | 2 | 3 | 4;
  adventureTitle: string;
  moduleId: string;
  moduleTitle: string;
  lessonId: string;
  lessonTitle: string;
  title: string;
  subtitle: string;
  emoji: string;
  learningObjective: string;
  instructions: string;
  successMessage: string;
  engineType: SandboxEngineType;
  sortingConfig?: SortingBucketsConfig;
  matcherConfig?: DeviceMatcherConfig;
  sequenceConfig?: SequenceBuilderConfig;
  patternConfig?: PatternBuilderConfig;
  canvasConfig?: DigitalCanvasConfig;
  soundConfig?: SoundPadConfig;
  scenarioConfig?: ScenarioSimulatorConfig;
}

export interface SandboxCompletionRecord {
  activityId: string;
  lessonId: string;
  moduleId: string;
  adventureId: string;
  completed: boolean;
  completedAt: string;
  attempts: number;
}

const SANDBOX_STORAGE_PREFIX = "clats_sandbox_progress_";

export function getSandboxProgressMap(childId: string): Record<string, SandboxCompletionRecord> {
  if (typeof window === "undefined" || !childId) return {};
  try {
    const raw = localStorage.getItem(`${SANDBOX_STORAGE_PREFIX}${childId}`);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function markSandboxActivityCompleted(
  childId: string,
  activity: SandboxActivity
): Record<string, SandboxCompletionRecord> {
  if (typeof window === "undefined" || !childId) return {};
  const existing = getSandboxProgressMap(childId);
  const prevAttempts = existing[activity.id]?.attempts || 0;
  const updated: Record<string, SandboxCompletionRecord> = {
    ...existing,
    [activity.id]: {
      activityId: activity.id,
      lessonId: activity.lessonId,
      moduleId: activity.moduleId,
      adventureId: activity.adventureId,
      completed: true,
      completedAt: new Date().toISOString(),
      attempts: prevAttempts + 1
    }
  };
  try {
    localStorage.setItem(`${SANDBOX_STORAGE_PREFIX}${childId}`, JSON.stringify(updated));
  } catch {}

  try {
    recordLearningEvent({
      childId,
      sourceType: "practice",
      sourceId: activity.id,
      eventType: "activity_completed",
      skillId: `sandbox.${activity.moduleId}.${activity.lessonId}`,
      success: true,
      metadata: {
        sandboxActivityId: activity.id,
        lessonId: activity.lessonId,
        moduleId: activity.moduleId,
        adventureId: activity.adventureId,
        engineType: activity.engineType
      }
    });
  } catch {}

  return updated;
}

export const SANDBOX_ACTIVITIES: SandboxActivity[] = [
  // ==========================================================================
  // ADVENTURE 1: AI & SMART TECHNOLOGY
  // Module 1 (t-a1m1): Technology Around Me
  // ==========================================================================
  {
    id: "sb-a1m1-l1",
    adventureId: "academy-1",
    adventureNumber: 1,
    adventureTitle: "AI & Smart Technology",
    moduleId: "t-a1m1",
    moduleTitle: "Module 1: Technology Around Me",
    lessonId: "t-a1m1-l1",
    lessonTitle: "What is Technology?",
    title: "Technology Tool Sorter",
    subtitle: "Sort human-made helper tools vs things from nature",
    emoji: "🛠️",
    learningObjective: "Identify technology as things people make to help us do everyday tasks.",
    instructions: "Tap an item card, then tap the right basket to sort Technology Tools from Nature Things!",
    successMessage: "You sorted every item! Technology is anything people make to help us do things.",
    engineType: "sorting-buckets",
    sortingConfig: {
      bucketA: { id: "A", label: "Technology Tool", emoji: "💡", color: "#10B981" },
      bucketB: { id: "B", label: "Grows in Nature", emoji: "🌳", color: "#F59E0B" },
      items: [
        {
          id: "item-phone",
          label: "Smartphone",
          emoji: "📱",
          correctBucket: "A",
          hint: "People make smartphones to help us talk and learn!"
        },
        {
          id: "item-bulb",
          label: "Light Bulb",
          emoji: "💡",
          correctBucket: "A",
          hint: "People invented light bulbs to help us see in the dark!"
        },
        {
          id: "item-apple",
          label: "Ripe Apple",
          emoji: "🍎",
          correctBucket: "B",
          hint: "Apples grow on trees in nature—they are food we eat!"
        },
        {
          id: "item-pencil",
          label: "Yellow Pencil",
          emoji: "✏️",
          correctBucket: "A",
          hint: "People make pencils as a tool to help us write and draw!"
        },
        {
          id: "item-tree",
          label: "Green Tree",
          emoji: "🌳",
          correctBucket: "B",
          hint: "Trees grow naturally in the soil and rain!"
        },
        {
          id: "item-banana",
          label: "Sweet Banana",
          emoji: "🍌",
          correctBucket: "B",
          hint: "Bananas grow on plants in nature!"
        }
      ]
    }
  },
  {
    id: "sb-a1m1-l2",
    adventureId: "academy-1",
    adventureNumber: 1,
    adventureTitle: "AI & Smart Technology",
    moduleId: "t-a1m1",
    moduleTitle: "Module 1: Technology Around Me",
    lessonId: "t-a1m1-l2",
    lessonTitle: "Smart Things Around Us",
    title: "Smart Device Simulator & Matcher",
    subtitle: "Match smart devices to how they sense, respond, and help",
    emoji: "🔊",
    learningObjective: "Explore familiar smart devices at home and school and how they help us.",
    instructions: "Tap a device on the left, then tap what it helps us do on the right to test it!",
    successMessage: "Awesome job! You matched each smart device and home helper to its job!",
    engineType: "device-matcher",
    matcherConfig: {
      promptLabel: "Device / Tool",
      targetLabel: "How It Helps Us",
      pairs: [
        {
          id: "pair-speaker",
          leftLabel: "Smart Speaker",
          leftEmoji: "🔊",
          rightLabel: "Listens and responds when we speak",
          rightEmoji: "🗣️",
          simulationReaction: "🔊 Smart Speaker lights up: 'Hello Explorer! Playing your favourite learning song!'"
        },
        {
          id: "pair-light",
          leftLabel: "Smart Light",
          leftEmoji: "💡",
          rightLabel: "Helps us see when it is dark",
          rightEmoji: "🌙",
          simulationReaction: "💡 Click! The smart bulb glows warm and bright so the room is easy to see!"
        },
        {
          id: "pair-fan",
          leftLabel: "Electric Fan",
          leftEmoji: "🌀",
          rightLabel: "Keeps us cool when it is hot",
          rightEmoji: "☀️",
          simulationReaction: "🌀 Whirrrr! Cool breeze flows across the room!"
        },
        {
          id: "pair-tablet",
          leftLabel: "School Tablet & TV",
          leftEmoji: "📱",
          rightLabel: "Helps teachers teach and children learn",
          rightEmoji: "🏫",
          simulationReaction: "📱 The screen opens an interactive story lesson for the classroom!"
        }
      ]
    }
  },

  // ==========================================================================
  // ADVENTURE 1: AI & SMART TECHNOLOGY
  // Module 2 (t-a1m2): Learning With AI
  // ==========================================================================
  {
    id: "sb-a1m2-l1",
    adventureId: "academy-1",
    adventureNumber: 1,
    adventureTitle: "AI & Smart Technology",
    moduleId: "t-a1m2",
    moduleTitle: "Module 2: Learning With AI",
    lessonId: "t-a1m2-l1",
    lessonTitle: "AI Can See",
    title: "AI Senses Explorer Lab",
    subtitle: "Simulate how cameras, microphones, and voice assistants work",
    emoji: "📷",
    learningObjective: "Understand how cameras capture pictures, microphones capture sounds, and AI responds.",
    instructions: "Connect each AI tool to what it captures or does to see the AI simulation in action!",
    successMessage: "Brilliant! You explored how AI works with cameras, microphones, and spoken words!",
    engineType: "device-matcher",
    matcherConfig: {
      promptLabel: "AI Sensor / Part",
      targetLabel: "What It Does",
      pairs: [
        {
          id: "ai-camera",
          leftLabel: "Camera Lens",
          leftEmoji: "📷",
          rightLabel: "Captures a picture for AI to recognize things",
          rightEmoji: "🐘",
          simulationReaction: "📷 Snap! AI scans the photo: 'I recognize a friendly elephant in the picture!'"
        },
        {
          id: "ai-mic",
          leftLabel: "Microphone",
          leftEmoji: "🎙️",
          rightLabel: "Captures spoken sounds and words",
          rightEmoji: "👂",
          simulationReaction: "🎙️ Sound wave captured! AI hears your spoken words clearly."
        },
        {
          id: "ai-voice",
          leftLabel: "Voice Assistant",
          leftEmoji: "🤖",
          rightLabel: "Uses technology to respond when we speak",
          rightEmoji: "💬",
          simulationReaction: "🤖 Voice Assistant replies: 'Here is the answer to your question!'"
        }
      ]
    }
  },
  {
    id: "sb-a1m2-l4",
    adventureId: "academy-1",
    adventureNumber: 1,
    adventureTitle: "AI & Smart Technology",
    moduleId: "t-a1m2",
    moduleTitle: "Module 2: Learning With AI",
    lessonId: "t-a1m2-l4",
    lessonTitle: "AI Can Learn Patterns",
    title: "AI Pattern Detective",
    subtitle: "Spot repeating patterns in pictures and sounds just like AI",
    emoji: "🧩",
    learningObjective: "Recognize repeating patterns in pictures and sounds.",
    instructions: "Look closely at the repeating sequence and tap the item that comes next!",
    successMessage: "You spotted every pattern! AI learns by noticing repeating patterns in pictures and sounds.",
    engineType: "pattern-builder",
    patternConfig: {
      rounds: [
        {
          id: "pat-1",
          prompt: "Picture Pattern: Camera, Sound, Camera, Sound... What comes next?",
          sequence: [
            { label: "Camera", emoji: "📷" },
            { label: "Sound", emoji: "🔊" },
            { label: "Camera", emoji: "📷" },
            { label: "Sound", emoji: "🔊" }
          ],
          options: [
            { label: "Camera", emoji: "📷", isCorrect: true },
            { label: "Sound", emoji: "🔊", isCorrect: false },
            { label: "Pillow", emoji: "🛏️", isCorrect: false }
          ],
          explanation: "The pattern alternates Camera 📷, Sound 🔊, so Camera 📷 comes next!"
        },
        {
          id: "pat-2",
          prompt: "Smart Light Pattern: Sun, Sun, Moon, Sun, Sun... What comes next?",
          sequence: [
            { label: "Sun", emoji: "☀️" },
            { label: "Sun", emoji: "☀️" },
            { label: "Moon", emoji: "🌙" },
            { label: "Sun", emoji: "☀️" },
            { label: "Sun", emoji: "☀️" }
          ],
          options: [
            { label: "Moon", emoji: "🌙", isCorrect: true },
            { label: "Sun", emoji: "☀️", isCorrect: false },
            { label: "Apple", emoji: "🍎", isCorrect: false }
          ],
          explanation: "After two Suns ☀️☀️ comes one Moon 🌙!"
        },
        {
          id: "pat-3",
          prompt: "Robot Step Pattern: Step, Clap, Jump, Step, Clap... What comes next?",
          sequence: [
            { label: "Step", emoji: "👣" },
            { label: "Clap", emoji: "👏" },
            { label: "Jump", emoji: "🚀" },
            { label: "Step", emoji: "👣" },
            { label: "Clap", emoji: "👏" }
          ],
          options: [
            { label: "Jump", emoji: "🚀", isCorrect: true },
            { label: "Step", emoji: "👣", isCorrect: false },
            { label: "Clap", emoji: "👏", isCorrect: false }
          ],
          explanation: "The 3-part pattern is Step 👣, Clap 👏, Jump 🚀!"
        }
      ]
    }
  },

  // ==========================================================================
  // ADVENTURE 2: DIGITAL LITERACY AND CYBER SAFETY
  // Module 1 (t-a2m1): My Digital World
  // ==========================================================================
  {
    id: "sb-a2m1-l1",
    adventureId: "academy-2",
    adventureNumber: 2,
    adventureTitle: "Digital Literacy and Cyber Safety",
    moduleId: "t-a2m1",
    moduleTitle: "Module 1: My Digital World",
    lessonId: "t-a2m1-l1",
    lessonTitle: "Asking Before Using Devices",
    title: "Ask First! Device Habit Sorter",
    subtitle: "Sort when to ask a parent or teacher vs healthy everyday habits",
    emoji: "🛡️",
    learningObjective: "Identify when to ask a trusted grown-up before using devices and practice healthy tech habits.",
    instructions: "Sort each situation into 'Ask a Grown-Up First' or 'Healthy Everyday Habit'!",
    successMessage: "Super Digital Citizen! You know when to ask a parent or teacher and how to keep healthy tech habits.",
    engineType: "sorting-buckets",
    sortingConfig: {
      bucketA: { id: "A", label: "Ask a Grown-Up First", emoji: "🙋", color: "#0284C7" },
      bucketB: { id: "B", label: "Healthy Tech Habit", emoji: "🌟", color: "#10B981" },
      items: [
        {
          id: "dig-1",
          label: "Using Mum or Dad's tablet",
          emoji: "📱",
          correctBucket: "A",
          hint: "Always ask a parent or teacher before picking up a device!"
        },
        {
          id: "dig-2",
          label: "Taking a break to play outside",
          emoji: "⚽",
          correctBucket: "B",
          hint: "Balancing screen time with outdoor play keeps our eyes and bodies happy!"
        },
        {
          id: "dig-3",
          label: "Clicking a pop-up or new app button",
          emoji: "📲",
          correctBucket: "A",
          hint: "Always show a trusted adult before tapping unknown buttons or apps!"
        },
        {
          id: "dig-4",
          label: "Sitting upright with screen arm's length away",
          emoji: "🪑",
          correctBucket: "B",
          hint: "Good posture and resting our eyes is a great healthy tech habit!"
        }
      ]
    }
  },
  {
    id: "sb-a2m1-l3",
    adventureId: "academy-2",
    adventureNumber: 2,
    adventureTitle: "Digital Literacy and Cyber Safety",
    moduleId: "t-a2m1",
    moduleTitle: "Module 1: My Digital World",
    lessonId: "t-a2m1-l3",
    lessonTitle: "Kindness Online",
    title: "Safe & Kind Online Choices Simulator",
    subtitle: "Practise kind messages, safe video choices, and protecting private info",
    emoji: "💬",
    learningObjective: "Practise kindness online, choosing safe videos, and keeping personal information safe.",
    instructions: "Read each digital scenario and tap the safest, kindest choice to see what happens!",
    successMessage: "You made every safe and kind choice! You are a true Safe Harbor Protector!",
    engineType: "scenario-simulator",
    scenarioConfig: {
      scenarios: [
        {
          id: "scen-kindness",
          situation: "Your classmate shares a digital drawing of a rainbow giraffe in the class group. What is the kindest reply?",
          emoji: "🎨",
          choices: [
            {
              id: "c1",
              text: "I love the bright colours you used! Great job!",
              emoji: "🌟",
              isSafeOrWise: true,
              consequence: "Your friend smiles! Kind words online make everyone feel happy and encouraged."
            },
            {
              id: "c2",
              text: "Giraffes don't look like that, this is silly.",
              emoji: "😕",
              isSafeOrWise: false,
              consequence: "Unkind words hurt feelings. Online, we treat others with the same kindness as in person!"
            }
          ]
        },
        {
          id: "scen-video",
          situation: "While watching a science cartoon, a strange video pops up that looks scary or unfamiliar. What should you do?",
          emoji: "🎬",
          choices: [
            {
              id: "c3",
              text: "Stop the video right away and tell a parent or teacher.",
              emoji: "🛡️",
              isSafeOrWise: true,
              consequence: "Great choice! Grown-ups help us stick to safe, age-appropriate learning videos."
            },
            {
              id: "c4",
              text: "Keep watching it in secret without telling anyone.",
              emoji: "🙈",
              isSafeOrWise: false,
              consequence: "Wait! If something online feels strange or scary, always pause and tell a trusted adult."
            }
          ]
        },
        {
          id: "scen-privacy",
          situation: "A message in a game asks for your home address and school name. What is the safe choice?",
          emoji: "🔒",
          choices: [
            {
              id: "c5",
              text: "Never share private information; show a parent immediately.",
              emoji: "✅",
              isSafeOrWise: true,
              consequence: "Spot on! Your home address, school name, and passwords are private information."
            },
            {
              id: "c6",
              text: "Type your home address so they can send a prize.",
              emoji: "⚠️",
              isSafeOrWise: false,
              consequence: "Never share personal information online! Always keep your address and school private."
            }
          ]
        }
      ]
    }
  },

  // ==========================================================================
  // ADVENTURE 3: CREATIVITY & PLAY
  // Module 1 (t-a3m1): Creative Explorer
  // ==========================================================================
  {
    id: "sb-a3m1-l2",
    adventureId: "academy-3",
    adventureNumber: 3,
    adventureTitle: "Creativity & Play",
    moduleId: "t-a3m1",
    moduleTitle: "Module 1: Creative Explorer",
    lessonId: "t-a3m1-l2",
    lessonTitle: "Digital Drawing",
    title: "Rainbow Digital Drawing & Shape Studio",
    subtitle: "Draw with digital brushes, explore colours, and stamp fun shapes",
    emoji: "🎨",
    learningObjective: "Use digital brushes, colours, and geometric shapes to create original artwork directly in CLATS.",
    instructions: "Pick at least 2 colours and stamp at least 2 shapes, plus draw on the canvas to create your digital masterpiece!",
    successMessage: "What a wonderful digital artwork! You used colours, brush strokes, and shapes like a true Creative Explorer!",
    engineType: "digital-canvas",
    canvasConfig: {
      prompt: "Draw a sunny adventure scene or friendly robot using colours and shape stamps!",
      requiredShapesCount: 2,
      requiredColorsCount: 2,
      starterPrompts: [
        "🤖 Draw a friendly helper robot",
        "🌈 Paint a rainbow over a village",
        "🚀 Sketch a starship in the sky"
      ],
      palette: [
        { name: "Emerald Teal", hex: "#2EC4B6" },
        { name: "Sunny Gold", hex: "#F59E0B" },
        { name: "Coral Red", hex: "#EF4444" },
        { name: "Ocean Blue", hex: "#0284C7" },
        { name: "Royal Purple", hex: "#8B5CF6" },
        { name: "Leaf Green", hex: "#10B981" }
      ],
      stamps: [
        { id: "circle", label: "Circle", emoji: "🟢" },
        { id: "star", label: "Star", emoji: "⭐" },
        { id: "heart", label: "Heart", emoji: "💖" },
        { id: "triangle", label: "Triangle", emoji: "🔺" },
        { id: "robot", label: "Robot", emoji: "🤖" },
        { id: "sun", label: "Sun", emoji: "☀️" }
      ]
    }
  },
  {
    id: "sb-a3m1-l3",
    adventureId: "academy-3",
    adventureNumber: 3,
    adventureTitle: "Creativity & Play",
    moduleId: "t-a3m1",
    moduleTitle: "Module 1: Creative Explorer",
    lessonId: "t-a3m1-l3",
    lessonTitle: "Story Adventures",
    title: "Picture Story Sequencer",
    subtitle: "Arrange picture cards in order to build a complete adventure story",
    emoji: "📖",
    learningObjective: "Arrange pictures and events in sequence (Beginning, Middle, End) to tell a clear story.",
    instructions: "Use the Move Left / Move Right buttons to put the 4 story cards in the right order from Step 1 to Step 4!",
    successMessage: "Your story flows from beginning to end! Great storytelling, Creative Explorer!",
    engineType: "sequence-builder",
    sequenceConfig: {
      goalText: "Put Kobe and Chibi's bridge-building story in order from 1 to 4:",
      steps: [
        {
          id: "story-1",
          order: 1,
          label: "Morning Idea",
          emoji: "🌅",
          detail: "Kobe and Chibi wake up and see the stream needs a safe footbridge."
        },
        {
          id: "story-2",
          order: 2,
          label: "Draw the Plan",
          emoji: "📐",
          detail: "They sketch a colourful bridge design using strong triangles and squares."
        },
        {
          id: "story-3",
          order: 3,
          label: "Build Together",
          emoji: "🛠️",
          detail: "Working as a team, they place the wooden planks step by step."
        },
        {
          id: "story-4",
          order: 4,
          label: "Happy Crossing!",
          emoji: "🎉",
          detail: "Everyone crosses the sturdy bridge safely and cheers together!"
        }
      ]
    }
  },
  {
    id: "sb-a3m1-l4",
    adventureId: "academy-3",
    adventureNumber: 3,
    adventureTitle: "Creativity & Play",
    moduleId: "t-a3m1",
    moduleTitle: "Module 1: Creative Explorer",
    lessonId: "t-a3m1-l4",
    lessonTitle: "Music and Sounds",
    title: "Melody & Sound Pad Studio",
    subtitle: "Experiment with musical notes and compose a 4-note victory tune",
    emoji: "🎵",
    learningObjective: "Experiment with musical sounds and combine notes to create a simple digital melody.",
    instructions: "Tap the colourful sound pads to hear their musical notes and add 4 notes to your melody bar, then press Play Melody!",
    successMessage: "Bravo! You composed and played your very own 4-note digital melody!",
    engineType: "sound-pad",
    soundConfig: {
      prompt: "Tap any 4 sound pads to build your custom melody, then press 'Play My Tune'!",
      targetBeatsCount: 4,
      pads: [
        { id: "pad-c", label: "Sunny Bell (Do)", emoji: "🔔", freq: 261.63, wave: "sine", color: "#EF4444" },
        { id: "pad-d", label: "Wooden Drum (Re)", emoji: "🥁", freq: 293.66, wave: "triangle", color: "#F59E0B" },
        { id: "pad-e", label: "Happy Marimba (Mi)", emoji: "🎹", freq: 329.63, wave: "sine", color: "#10B981" },
        { id: "pad-g", label: "Ocean Chime (Sol)", emoji: "🌊", freq: 392.0, wave: "sine", color: "#0284C7" },
        { id: "pad-a", label: "Star Flute (La)", emoji: "✨", freq: 440.0, wave: "triangle", color: "#8B5CF6" },
        { id: "pad-c2", label: "Rainbow Harp (High Do)", emoji: "🌈", freq: 523.25, wave: "sine", color: "#EC4899" }
      ]
    }
  },

  // ==========================================================================
  // ADVENTURE 4: ADAPTABILITY & LIFELONG LEARNING
  // Module 1 (t-a4m1): Curious Explorers & Module 2 (t-a4m2): Learning Adventures
  // ==========================================================================
  {
    id: "sb-a4m1-l3",
    adventureId: "academy-4",
    adventureNumber: 4,
    adventureTitle: "Adaptability & Lifelong Learning",
    moduleId: "t-a4m1",
    moduleTitle: "Module 1: Curious Explorers",
    lessonId: "t-a4m1-l3",
    lessonTitle: "Finding Patterns Around Us",
    title: "Nature & Everyday Pattern Mission",
    subtitle: "Recognize and complete patterns in nature and daily life",
    emoji: "🔍",
    learningObjective: "Observe and complete repeating patterns in nature and the world around us.",
    instructions: "Observe each pattern carefully and tap the piece that completes the sequence!",
    successMessage: "Wonderful observation! You found every pattern around us like a true Curious Explorer!",
    engineType: "pattern-builder",
    patternConfig: {
      rounds: [
        {
          id: "nat-1",
          prompt: "Garden Pattern: Seed, Sprout, Flower, Seed, Sprout... What comes next?",
          sequence: [
            { label: "Seed", emoji: "🌰" },
            { label: "Sprout", emoji: "🌱" },
            { label: "Flower", emoji: "🌻" },
            { label: "Seed", emoji: "🌰" },
            { label: "Sprout", emoji: "🌱" }
          ],
          options: [
            { label: "Flower", emoji: "🌻", isCorrect: true },
            { label: "Seed", emoji: "🌰", isCorrect: false },
            { label: "Sprout", emoji: "🌱", isCorrect: false }
          ],
          explanation: "Plants grow in a cycle: Seed 🌰 → Sprout 🌱 → Flower 🌻!"
        },
        {
          id: "nat-2",
          prompt: "Bead Necklace Pattern: Gold, Blue, Blue, Gold, Blue... What comes next?",
          sequence: [
            { label: "Gold", emoji: "🟡" },
            { label: "Blue", emoji: "🔵" },
            { label: "Blue", emoji: "🔵" },
            { label: "Gold", emoji: "🟡" },
            { label: "Blue", emoji: "🔵" }
          ],
          options: [
            { label: "Blue", emoji: "🔵", isCorrect: true },
            { label: "Gold", emoji: "🟡", isCorrect: false },
            { label: "Green", emoji: "🟢", isCorrect: false }
          ],
          explanation: "The bead pattern is 1 Gold 🟡 followed by 2 Blues 🔵🔵!"
        }
      ]
    }
  },
  {
    id: "sb-a4m2-l2",
    adventureId: "academy-4",
    adventureNumber: 4,
    adventureTitle: "Adaptability & Lifelong Learning",
    moduleId: "t-a4m2",
    moduleTitle: "Module 2: Learning Adventures",
    lessonId: "t-a4m2-l2",
    lessonTitle: "Mistakes Help Us Grow",
    title: "Problem-Solver & Growth Mindset Quest",
    subtitle: "Make choices, learn from mistakes, and work together to solve challenges",
    emoji: "🧭",
    learningObjective: "Explore different ways of solving everyday challenges, learning from mistakes, and working together.",
    instructions: "Read each everyday challenge and choose the adaptable, curious way to solve it!",
    successMessage: "Amazing resilience! You asked questions, learned from mistakes, and worked together!",
    engineType: "scenario-simulator",
    scenarioConfig: {
      scenarios: [
        {
          id: "adapt-1",
          situation: "You are building a tall block tower, and the top blocks tumble down! What is the best way to respond?",
          emoji: "🧱",
          choices: [
            {
              id: "a1",
              text: "See why it wobbled, make the base wider, and try again!",
              emoji: "💡",
              isSafeOrWise: true,
              consequence: "Your second tower stands tall and strong! Mistakes show us how to build even better."
            },
            {
              id: "a2",
              text: "Give up and say 'I can never build anything!'",
              emoji: "😣",
              isSafeOrWise: false,
              consequence: "Wait! Every builder makes mistakes at first. Trying a new idea helps our brains grow!"
            }
          ]
        },
        {
          id: "adapt-2",
          situation: "You and a friend both want to test a new science puzzle at the same time. How can you work together?",
          emoji: "🤝",
          choices: [
            {
              id: "a3",
              text: "Take turns, share clues, and solve the puzzle as a team!",
              emoji: "🌟",
              isSafeOrWise: true,
              consequence: "Working together made the puzzle twice as fun and you solved it super fast!"
            },
            {
              id: "a4",
              text: "Hide the puzzle pieces so nobody else can play.",
              emoji: "❌",
              isSafeOrWise: false,
              consequence: "Hiding pieces stops the fun for everyone. Sharing and teamwork help everyone learn!"
            }
          ]
        },
        {
          id: "adapt-3",
          situation: "You see a solar lamp that turns on by itself when the sun goes down. What would a Curious Explorer do?",
          emoji: "🔍",
          choices: [
            {
              id: "a5",
              text: "Ask 'How does the solar panel store sunlight during the day?'",
              emoji: "❓",
              isSafeOrWise: true,
              consequence: "Great question! Asking 'How' and 'Why' helps you discover how solar energy works!"
            },
            {
              id: "a6",
              text: "Ignore it because asking questions isn't important.",
              emoji: "😐",
              isSafeOrWise: false,
              consequence: "Asking questions is how every great inventor and explorer learns new things!"
            }
          ]
        }
      ]
    }
  }
];
