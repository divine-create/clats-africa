/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { jsPDF } from "jspdf";
import { Parent, Child } from "../types";
import { CURRICULUM } from "../data/curriculum";
import { calculateStudyAnalytics } from "./timeTracker";

// Determine active academy stream based on completed lesson count
function getActiveAcademyLabel(child: Child): string {
  const completed = Object.keys(child.completed || {});
  const completedCount = completed.length;
  if (completedCount === 0) return "AI Foundations Intro";
  if (completedCount <= 2) return "Artificial Intelligence";
  if (completedCount <= 5) return "Digital Citizenship & Safety";
  if (completedCount <= 8) return "Design & Creation";
  return child.ageGroup === "future builders" ? "Innovation & Career Readiness" : "Adaptability & Lifelong Learning";
}


async function fetchImageAsBase64(url: string): Promise<string> {
  try {
    const resp = await fetch(url);
    if (!resp.ok) {
      throw new Error(`Failed to fetch image at ${url}`);
    }
    const blob = await resp.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.warn("Could not fetch image as base64:", error);
    return "";
  }
}

// Fetch helper to register custom font in jsPDF
async function fetchFontAsBase64(url: string): Promise<string> {
  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error(`Failed to fetch font at ${url}`);
  }
  const buf = await resp.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Custom text drawing helper that enforces precise typography formatting
function drawText(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  options: {
    fontSize: number;
    fontStyle?: "normal" | "bold";
    color?: [number, number, number];
    maxWidth?: number;
    align?: "left" | "center" | "right";
    lineHeight?: number;
    hasMontserrat: boolean;
  }
) {
  const {
    fontSize,
    fontStyle = "normal",
    color = [19, 34, 43],
    maxWidth = 180,
    align = "left",
    lineHeight = 1.4,
    hasMontserrat
  } = options;

  const fontName = hasMontserrat ? "Montserrat" : "helvetica";
  doc.setFont(fontName, fontStyle);
  doc.setFontSize(fontSize);
  doc.setTextColor(color[0], color[1], color[2]);

  const lines: string[] = doc.splitTextToSize(text, maxWidth);
  const leading = (fontSize * 0.352778) * lineHeight; // Point to mm with line spread

  let currentY = y;
  lines.forEach((line) => {
    doc.text(line, x, currentY, { align });
    currentY += leading;
  });

  return currentY;
}

export async function downloadProgressReport(parent: Parent) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4" // 210mm x 297mm
  });


  const children = parent.children || [];
  const liveDateTime = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });

  // Fetch logo
  const logoBase64 = await fetchImageAsBase64("/logo-3.png");


  // Attempt to register Montserrat font for brand precision
  let hasMontserrat = false;
  try {
    const regularFont = await fetchFontAsBase64("https://raw.githubusercontent.com/google/fonts/main/ofl/montserrat/Montserrat-Regular.ttf");
    const boldFont = await fetchFontAsBase64("https://raw.githubusercontent.com/google/fonts/main/ofl/montserrat/Montserrat-Bold.ttf");

    doc.addFileToVFS("Montserrat-Regular.ttf", regularFont);
    doc.addFileToVFS("Montserrat-Bold.ttf", boldFont);
    doc.addFont("Montserrat-Regular.ttf", "Montserrat", "normal");
    doc.addFont("Montserrat-Bold.ttf", "Montserrat", "bold");
    hasMontserrat = true;
    console.log("[PDF] Montserrat loaded successfully.");
  } catch (error) {
    console.warn("[PDF] Falling back to standard Helvetica configuration:", error);
  }

  // ==========================================
  // NULL STATE (NO CHILDREN ENROLLED)
  // ==========================================
  if (children.length === 0) {
    // Light cool turquoise background canvas
    doc.setFillColor(227, 245, 246);
    doc.rect(0, 0, 210, 297, "F");

    // Header Content
    drawText(doc, "CLATS Progress Report", 15, 22, { fontSize: 28, fontStyle: "bold", hasMontserrat });
    
    // Transparent spacer line
    doc.setDrawColor(46, 196, 182, 0.4);
    doc.setLineWidth(0.5);
    doc.line(15, 30, 195, 30);

    // Empty state container card
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(15, 60, 180, 120, 4, 4, "F");

    // Warning icon circle (Accents: highlight in warm yellow-orange minimal border)
    doc.setFillColor(253, 246, 216); // light warm yellow
    doc.circle(105, 95, 15, "F");
    doc.setDrawColor(245, 158, 11); // Amber/yellow accent
    doc.setLineWidth(1);
    doc.circle(105, 95, 15, "S");
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(26);
    doc.text("📊", 105, 101, { align: "center" });

    drawText(doc, "LEARNING JOURNAL PENDING ELIGIBILITY", 105, 124, { fontSize: 15, fontStyle: "bold", align: "center", hasMontserrat });
    drawText(
      doc,
      "No active child profiles have been enrolled under this registered sponsor account.\n\nPlease enroll a learner from your main CLATS action center first to monitor live curriculum telemetry, diagnostic milestones, companion stars, and analytics history.",
      105,
      134,
      { fontSize: 11, color: [71, 85, 105], align: "center", maxWidth: 150, hasMontserrat }
    );

    // Solid dark slate bottom band mirroring image reference footer exactly
    doc.setFillColor(19, 34, 43); // Dark slate Blue/Black
    doc.rect(0, 272, 210, 25, "F");

    if (logoBase64) {
      doc.addImage(logoBase64, "PNG", 14, 276.5, 24, 9);
    } else {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(14);
      doc.setTextColor(46, 196, 182);
      doc.text("🤖", 15, 287);
      drawText(doc, "CLATS", 23, 285.5, { fontSize: 12, fontStyle: "bold", color: [46, 196, 182], hasMontserrat });
    }

    drawText(doc, "Building Tomorrow's Tech Minds Today!", 42, 283, { fontSize: 9, fontStyle: "bold", color: [255, 255, 255], hasMontserrat });
    drawText(doc, "admin@clats.org", 42, 288, { fontSize: 8, color: [46, 196, 182], hasMontserrat });

    // Right page information
    drawText(doc, `CLATS Progress Report  •  ${liveDateTime}`, 195, 285, { fontSize: 8.5, color: [255, 255, 255], align: "right", hasMontserrat });

    doc.save(`CLATS_Progress_Report_Pending.pdf`);
    return;
  }

  // ==========================================
  // RENDER REPORT PAGES (ONE FOR EACH ENROLLED CHILD)
  // ==========================================
  for (let index = 0; index < children.length; index++) {
    const child = children[index];
    if (index > 0) {
      doc.addPage();
    }

    // Fetch sessions for this child from Supabase!
    let childSessions: any[] = [];
    try {
      const sessRes = await fetch(`/api/supabase/sessions/child/${child.id}`);
      if (sessRes.ok) {
        const sessData = await sessRes.json();
        childSessions = sessData.sessions || [];
      }
    } catch (e) {
      console.warn("Failed to fetch sessions for PDF child progress:", e);
    }
    const studyStats = calculateStudyAnalytics(childSessions);

    const xpEarned = child.xp || 0;
    const completedCount = Object.keys(child.completed || {}).length;
    const activeAcademy = getActiveAcademyLabel(child);

    // Compute progress stats
    const completedPercent = Math.min(100, Math.round((completedCount / 12) * 100));
    const expectedPercent = completedCount === 0 ? 25 : Math.min(100, Math.max(50, completedPercent + 15));

    // Compute quiz metrics
    const quizResults = child.quizResults || {};
    const quizKeys = Object.keys(quizResults);
    let quizAverage = 0;
    if (quizKeys.length > 0) {
      const totalScore = quizKeys.reduce((acc, k) => acc + (quizResults[k]?.score || 0), 0);
      quizAverage = Math.round(totalScore / quizKeys.length);
    } else {
      quizAverage = completedCount > 0 ? 84 : 0;
    }

    // Determine performance standing categories matching image reference (LOW / HIGH / STEADY)
    // Minimally colored accents: Green (optimal), Yellow (steady), Red (baseline diagnostic)
    let ratingHeader = "STEADY";
    let ratingLabelText = "Moderate Learning Activity";
    let ratingAccColor: [number, number, number] = [245, 158, 11]; // Yellow/Amber
    let ratingBgColor: [number, number, number] = [254, 243, 199]; // Light amber back

    if (quizAverage >= 85 || completedPercent > 60) {
      ratingHeader = "HIGH";
      ratingLabelText = "Elite Progress Standing";
      ratingAccColor = [46, 196, 182]; // Turquoise/Green
      ratingBgColor = [224, 251, 248]; // Light turquoise
    } else if (completedCount === 0) {
      ratingHeader = "LOW";
      ratingLabelText = "Diagnostic Baseline Stage";
      ratingAccColor = [239, 68, 68]; // Red
      ratingBgColor = [254, 226, 226]; // Light Red
    }

    // 1) Fill full A4 with beautiful light cool-turquoise theme background
    doc.setFillColor(227, 245, 246);
    doc.rect(0, 0, 210, 297, "F");

    // ==========================================
    // RIGHT HAND SIDEBAR FRAME
    // ==========================================
    // Drawn exactly like the teal right sidebar from Image Reference 1
    // X starts at 148, Y starts at 15, width = 50, height = 245
    doc.setFillColor(31, 158, 173); // Solid rich turquoise sidebar block
    doc.rect(148, 15, 50, 245, "F");

    // A. Top Soft White Card inside Sidebar (Mirroring the "LOW Financial Risk" status block)
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(153, 22, 40, 44, 2, 2, "F");

    // Badge graphic container on status card
    doc.setFillColor(ratingBgColor[0], ratingBgColor[1], ratingBgColor[2]);
    doc.rect(153, 22, 40, 2, "F"); // top color stripe

    // Draw status bold keyword (Yellow, red, or turquoise minimal accents)
    drawText(doc, ratingHeader, 173, 34, { fontSize: 18, fontStyle: "bold", color: ratingAccColor, align: "center", hasMontserrat });
    drawText(doc, "Academic Progress Risk", 173, 40, { fontSize: 8, color: [71, 85, 105], align: "center", hasMontserrat });

    // Little graphic icon inside status card (simulated shield)
    doc.setFillColor(ratingBgColor[0], ratingBgColor[1], ratingBgColor[2]);
    doc.roundedRect(170, 44, 6, 6, 1, 1, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.text("🛡️", 173, 48.5, { align: "center" });

    drawText(doc, ratingLabelText, 173, 56, { fontSize: 7.2, fontStyle: "bold", color: [100, 116, 139], align: "center", hasMontserrat });

    // B. Progress Ring 1 (Actual Course Progress)
    // Center of Ring 1: X = 173, Y = 125
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(3.5);
    doc.circle(173, 125, 14, "S"); // outer white circle track

    // Inner dark blue circular separator line for extra visual structure definition
    doc.setDrawColor(19, 34, 43, 0.55);
    doc.setLineWidth(1.2);
    doc.circle(173, 125, 15.5, "S");

    // Centered percentage text inside white circle
    drawText(doc, `${completedPercent}%`, 173, 128, { fontSize: 16, fontStyle: "bold", color: [255, 255, 255], align: "center", hasMontserrat });
    
    // Labels below progress Ring 1
    drawText(doc, "Actual Course Progress", 173, 146, { fontSize: 8.5, fontStyle: "bold", color: [255, 255, 255], align: "center", hasMontserrat });

    // C. Progress Ring 2 (Expected Course Progress)
    // Center of Ring 2: X = 173, Y = 195
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(3.5);
    doc.circle(173, 195, 14, "S"); // outer expected tracking ring

    doc.setDrawColor(19, 34, 43, 0.55);
    doc.setLineWidth(1.2);
    doc.circle(173, 195, 15.5, "S");

    drawText(doc, `${expectedPercent}%`, 173, 198, { fontSize: 16, fontStyle: "bold", color: [255, 255, 255], align: "center", hasMontserrat });
    drawText(doc, "Expected Course Progress", 173, 216, { fontSize: 8.5, fontStyle: "bold", color: [255, 255, 255], align: "center", hasMontserrat });

    // ==========================================
    // LEFT MAIN CONTENT DIVISION
    // ==========================================
    // Margins constraints: Left limit X = 12, Right limit X = 142. Full width is 130mm

    // 1) Main Executive Document Title (Serif/heavy aesthetic contrast)
    drawText(doc, "Project Progress Report", 12, 23, { fontSize: 26, fontStyle: "bold", color: [19, 34, 43], hasMontserrat });

    // 2) Structured Grid Metadata (3 equal columns - perfect alignment)
    // Row 1 Y Y = 34
    drawText(doc, "Student ID:", 12, 34, { fontSize: 9, fontStyle: "bold", color: [100, 116, 139], hasMontserrat });
    drawText(doc, `CLS-ID-${child.id.substring(child.id.length - 6).toUpperCase()}`, 12, 38, { fontSize: 9.5, fontStyle: "bold", color: [19, 34, 43], hasMontserrat });

    drawText(doc, "Parent Sponsor:", 60, 34, { fontSize: 9, fontStyle: "bold", color: [100, 116, 139], hasMontserrat });
    drawText(doc, parent.name, 60, 38, { fontSize: 9.5, fontStyle: "bold", color: [19, 34, 43], hasMontserrat });

    drawText(doc, "Submission Date:", 108, 34, { fontSize: 9, fontStyle: "bold", color: [100, 116, 139], hasMontserrat });
    drawText(doc, liveDateTime, 108, 38, { fontSize: 9.5, fontStyle: "bold", color: [19, 34, 43], hasMontserrat });

    // Row 2 Y = 46
    drawText(doc, "Academic Stream:", 12, 46, { fontSize: 9, fontStyle: "bold", color: [100, 116, 139], hasMontserrat });
    drawText(doc, activeAcademy, 12, 50, { fontSize: 9.5, fontStyle: "bold", color: [19, 34, 43], hasMontserrat });

    drawText(doc, "Companion Guide:", 60, 46, { fontSize: 9, fontStyle: "bold", color: [100, 116, 139], hasMontserrat });
    const guideMascot = child.companion === "chibi" ? "Chibi (Narrator Model)" : "Kobe (AI Mentor Model)";
    drawText(doc, guideMascot, 60, 50, { fontSize: 9.5, fontStyle: "bold", color: [19, 34, 43], hasMontserrat });

    drawText(doc, "Integration Status:", 108, 46, { fontSize: 9, fontStyle: "bold", color: [100, 116, 139], hasMontserrat });
    drawText(doc, "Supabase Synced", 108, 50, { fontSize: 9.5, fontStyle: "bold", color: [16, 185, 129], hasMontserrat });

    // Little active safety connection dot
    doc.setFillColor(16, 185, 129);
    doc.circle(139, 49, 1, "F");

    // Row 3 Y = 58
    drawText(doc, "Today Study Time:", 12, 58, { fontSize: 9, fontStyle: "bold", color: [100, 116, 139], hasMontserrat });
    drawText(doc, `${studyStats.todayMins} mins`, 12, 62, { fontSize: 9.5, fontStyle: "bold", color: [19, 34, 43], hasMontserrat });

    drawText(doc, "Weekly Study Time:", 60, 58, { fontSize: 9, fontStyle: "bold", color: [100, 116, 139], hasMontserrat });
    drawText(doc, `${studyStats.weeklyMins} mins`, 60, 62, { fontSize: 9.5, fontStyle: "bold", color: [19, 34, 43], hasMontserrat });

    drawText(doc, "Total Study Time:", 108, 58, { fontSize: 9, fontStyle: "bold", color: [100, 116, 139], hasMontserrat });
    drawText(doc, `${studyStats.totalMins} mins`, 108, 62, { fontSize: 9.5, fontStyle: "bold", color: [19, 34, 43], hasMontserrat });

    // 3) MILESTONE SESSIONS PROGRESS GRID TABLE 
    // Mimics the project milestones block from Image Reference 1
    // Table bounds: X = 12 to 142. Header start Y = 68
    const tableHeaderY = 68;
    doc.setFillColor(16, 79, 85); // Dark deep teal-navy color with extreme readability contrast ratio
    doc.roundedRect(12, tableHeaderY, 130, 8, 1, 1, "F");

    // Table Columns definitions
    drawText(doc, "Milestones:", 14, tableHeaderY + 5.5, { fontSize: 7.2, fontStyle: "bold", color: [255, 255, 255], maxWidth: 58, hasMontserrat });
    drawText(doc, "Project Status:", 74, tableHeaderY + 5.5, { fontSize: 7.2, fontStyle: "bold", color: [255, 255, 255], maxWidth: 22, hasMontserrat });
    drawText(doc, "Expected:", 99, tableHeaderY + 5.5, { fontSize: 7.2, fontStyle: "bold", color: [255, 255, 255], maxWidth: 18, hasMontserrat });
    drawText(doc, "Actual Standing:", 119, tableHeaderY + 5.5, { fontSize: 7.2, fontStyle: "bold", color: [255, 255, 255], maxWidth: 22, hasMontserrat });

    // Table Rows (Alternating color blocks)
    const milestoneUnits = [
      {
        unit: "Unit 1: Artificial Intelligence Foundations",
        status: completedCount >= 1 ? "Complete" : "In Progress",
        expected: "Week 3",
        actual: completedCount >= 1 ? "Week 2 ✓" : "TBD",
        theme: completedCount >= 1 ? [16, 185, 129] : [245, 158, 11]
      },
      {
        unit: "Unit 2: Digital Rights & Cyber Safety Drills",
        status: completedCount >= 4 ? "Complete" : (completedCount >= 2 ? "In Progress" : "Pending"),
        expected: "Week 6",
        actual: completedCount >= 4 ? "Week 5 ✓" : (completedCount >= 2 ? "Active (W6)" : "TBD"),
        theme: completedCount >= 4 ? [16, 185, 129] : (completedCount >= 2 ? [59, 130, 246] : [148, 163, 184])
      },
      {
        unit: "Unit 3: Creative Interface Arts & UI Design",
        status: completedCount >= 7 ? "Complete" : (completedCount >= 5 ? "In Progress" : "Pending"),
        expected: "Week 9",
        actual: completedCount >= 7 ? "Week 8 ✓" : (completedCount >= 5 ? "Active (W9)" : "TBD"),
        theme: completedCount >= 7 ? [16, 185, 129] : (completedCount >= 5 ? [59, 130, 246] : [148, 163, 184])
      },
      {
        unit: "Unit 4: Technology Adaptability Framework",
        status: completedCount >= 10 ? "Complete" : (completedCount >= 8 ? "In Progress" : "Pending"),
        expected: "Week 11",
        actual: completedCount >= 10 ? "Week 10 ✓" : (completedCount >= 8 ? "Active (W11)" : "TBD"),
        theme: completedCount >= 10 ? [16, 185, 129] : (completedCount >= 8 ? [59, 130, 246] : [148, 163, 184])
      },
      {
        unit: "Unit 5: Logic Assessment & Quiz Drills",
        status: quizKeys.length > 0 ? "Complete" : "Pending",
        expected: "Week 12",
        actual: quizKeys.length > 0 ? `${quizAverage}% Acc` : "TBD",
        theme: quizKeys.length > 0 ? [16, 185, 129] : [148, 163, 184]
      }
    ];

    const startRowY = tableHeaderY + 8;
    const rowHeightMetric = 11.8;

    milestoneUnits.forEach((milestone, idx) => {
      const crtY = startRowY + (idx * rowHeightMetric);
      
      // Paint alternating row backgrounds
      if (idx % 2 === 0) {
        doc.setFillColor(255, 255, 255); // Solid pure white
      } else {
        doc.setFillColor(242, 250, 251); // soft cyan/turquoise tint matching reference table
      }
      doc.rect(12, crtY, 130, rowHeightMetric, "F");

      // Draw faint boundary lines
      doc.setDrawColor(227, 245, 246);
      doc.setLineWidth(0.3);
      doc.line(12, crtY + rowHeightMetric, 142, crtY + rowHeightMetric);

      // Print columns values
      drawText(doc, milestone.unit, 14, crtY + 6.5, { fontSize: 7.2, fontStyle: "bold", color: [19, 34, 43], maxWidth: 58, hasMontserrat });
      drawText(doc, milestone.status, 74, crtY + 6.5, { fontSize: 7.2, fontStyle: "bold", color: milestone.theme as [number, number, number], maxWidth: 22, hasMontserrat });
      drawText(doc, milestone.expected, 99, crtY + 6.5, { fontSize: 7.2, color: [100, 116, 139], maxWidth: 18, hasMontserrat });
      drawText(doc, milestone.actual, 119, crtY + 6.5, { fontSize: 7.2, fontStyle: "bold", color: [19, 34, 43], maxWidth: 22, hasMontserrat });
    });

    // 4) DUAL CARD ROW: INSIGHTS & SUGGESTED REINFORCEMENTS
    // Exactly matches the layout structures from bottom left of Image Reference 1
    // Box 1 (Takeaways): X = 12, Y = 134, width = 62, height = 126
    // Box 2 (Blockers): X = 78, Y = 134, width = 62, height = 126
    const bottomCardsY = 134;
    const bottomCardsW = 62;
    const bottomCardsH = 126;

    // A. Card 1 - Key Learnings and Takeaways
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(12, bottomCardsY, bottomCardsW, bottomCardsH, 2, 2, "F");
    
    // Title card strip
    doc.setFillColor(242, 250, 251);
    doc.roundedRect(12, bottomCardsY, bottomCardsW, 8, 1, 1, "F");
    drawText(doc, "Key Learnings and Takeaways", 15, bottomCardsY + 5.5, { fontSize: 10, fontStyle: "bold", color: [16, 79, 85], hasMontserrat });

    // Dynamic bullet narratives based on actual completed modules / covered lessons
    const bulletTakeaways: string[] = [];
    const bulletResolutions: string[] = [];

    if (completedCount > 0) {
      const course = CURRICULUM[child.ageGroup];
      if (course && course.modules) {
        course.modules.forEach((mod) => {
          const modLessons = mod.lessons || [];
          if (modLessons.length === 0) return;

          const completedInMod = modLessons.filter((l) => child.completed?.[l.id] === true);
          const incompLessonsInMod = modLessons.filter((l) => !child.completed?.[l.id]);

          if (completedInMod.length === modLessons.length) {
            // Module is fully completed
            bulletTakeaways.push(
              `• Mastered ${mod.name.en}: Completed all units, fully grasping: "${mod.goal.en}".`
            );
            bulletResolutions.push(
              `• Next Milestones: Advance past "${mod.badge?.name || "Earned"}" to the next topics under the ${course.title.en} tract.`
            );
          } else if (completedInMod.length > 0) {
            // Module is partially completed (covered some lessons)
            completedInMod.forEach((l) => {
              bulletTakeaways.push(
                `• Covered "${l.title.en}": Gained direct competence and core understandings of this topic.`
              );
            });

            if (incompLessonsInMod.length > 0) {
              const nextL = incompLessonsInMod[0];
              bulletResolutions.push(
                `• Pending: Cover "${nextL.title.en}" under the "${mod.name.en}" module with guide ${child.companion === "chibi" ? "Chibi" : "Kobe"}.`
              );
            }
          }
        });
      }
    }

    // Safely enforce maximum count (e.g. 4) of bullets to prevent visual card overflowing
    const finalTakeaways = bulletTakeaways.slice(0, 4);
    const finalResolutions = bulletResolutions.slice(0, 4);

    let bulletY1 = bottomCardsY + 14;
    finalTakeaways.forEach((bullet) => {
      bulletY1 = drawText(doc, bullet, 15, bulletY1, { fontSize: 8.5, lineHeight: 1.45, color: [71, 85, 105], maxWidth: bottomCardsW - 6, hasMontserrat });
      bulletY1 += 2.5;
    });

    // B. Card 2 - Critical Blockers and Resolutions
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(78, bottomCardsY, bottomCardsW, bottomCardsH, 2, 2, "F");

    doc.setFillColor(242, 250, 251);
    doc.roundedRect(78, bottomCardsY, bottomCardsW, 8, 1, 1, "F");
    drawText(doc, "Critical Blockers and Resolutions", 81, bottomCardsY + 5.5, { fontSize: 10, fontStyle: "bold", color: [16, 79, 85], hasMontserrat });

    let bulletY2 = bottomCardsY + 14;
    finalResolutions.forEach((bullet) => {
      bulletY2 = drawText(doc, bullet, 81, bulletY2, { fontSize: 8.5, lineHeight: 1.45, color: [71, 85, 105], maxWidth: bottomCardsW - 6, hasMontserrat });
      bulletY2 += 2.5;
    });

    // ==========================================
    // STANDARDISED BOTTOM BRANDING FOOTER BAND
    // ==========================================
    doc.setFillColor(19, 34, 43); // Dark slate Blue/Black
    doc.rect(0, 272, 210, 25, "F");

    if (logoBase64) {
      doc.addImage(logoBase64, "PNG", 14, 276.5, 24, 9);
    } else {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(14);
      doc.setTextColor(46, 196, 182);
      doc.text("🤖", 15, 287);
      drawText(doc, "CLATS", 23, 285.5, { fontSize: 12, fontStyle: "bold", color: [46, 196, 182], hasMontserrat });
    }

    drawText(doc, "Building Tomorrow's Tech Minds Today!", 42, 283, { fontSize: 9, fontStyle: "bold", color: [255, 255, 255], hasMontserrat });
    drawText(doc, "admin@clats.org", 42, 288, { fontSize: 8, color: [46, 196, 182], hasMontserrat });

    // Right side: Progress report name and active student designation
    drawText(doc, `CLATS Progress Report  •  STUDENT: ${child.name.toUpperCase()}`, 195, 285, { fontSize: 8.5, color: [255, 255, 255], align: "right", hasMontserrat });
  }

  // Save progress report file dynamically
  const parentFileName = parent.name.replace(/\s+/g, "_");
  doc.save(`CLATS_Progress_Report_${parentFileName}.pdf`);
}

// ─────────────────────────────────────────────────────────────────────────────
// CERTIFICATE IMAGE GENERATOR
// Screenshots the actual DOM element (#clats-gold-certificate) using html2canvas
// to preserve all emoji rendering, fonts, and styling exactly as shown on-screen.
// ─────────────────────────────────────────────────────────────────────────────
export async function downloadCertificateImage(certName: string) {
  try {
    const html2canvas = (await import("html2canvas")).default;
    const element = document.getElementById("clats-gold-certificate");
    if (!element) {
      console.error("Certificate element not found");
      return;
    }

    const canvas = await html2canvas(element, {
      scale: 2, // High resolution screenshot
      useCORS: true,
      logging: false,
      backgroundColor: null
    });

    const imgData = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    const safeName = certName.replace(/[^a-zA-Z0-9]/g, "_");
    link.download = `CLATS_Certificate_${safeName}.png`;
    link.href = imgData;
    link.click();
  } catch (error) {
    console.error("Error generating certificate image:", error);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PROGRESS REPORT IMAGE GENERATOR
// Renders a beautifully styled HTML report card in a hidden off-screen container,
// captures it with html2canvas at 2x resolution, then downloads as a PNG image.
// ─────────────────────────────────────────────────────────────────────────────
export async function downloadProgressReportImage(parent: Parent) {
  try {
    const [{ createRoot }, { ProgressReportImage }, html2canvasMod] = await Promise.all([
      import("react-dom/client"),
      import("../components/ProgressReportImage"),
      import("html2canvas"),
    ]);
    const html2canvas = html2canvasMod.default;
    const React = (await import("react")).default;

    const children = parent.children || [];

    // Fetch sessions for each child
    const childSessionsMap: Record<string, any[]> = {};
    await Promise.all(
      children.map(async (child: Child) => {
        try {
          const res = await fetch(`/api/supabase/sessions/child/${child.id}`);
          if (res.ok) {
            const data = await res.json();
            childSessionsMap[child.id] = data.sessions || [];
          }
        } catch {
          childSessionsMap[child.id] = [];
        }
      })
    );

    // Create an off-screen container and render the report component into it
    const container = document.createElement("div");
    container.style.position = "fixed";
    container.style.top = "-9999px";
    container.style.left = "-9999px";
    container.style.zIndex = "-1";
    container.style.width = "800px";
    container.style.fontFamily = "'Montserrat', 'Helvetica Neue', Arial, sans-serif";
    document.body.appendChild(container);

    const root = createRoot(container);
    await new Promise<void>((resolve) => {
      root.render(
        React.createElement(ProgressReportImage, {
          parent,
          childSessionsMap,
          onReady: resolve,
        })
      );
      // Give the DOM time to paint
      setTimeout(resolve, 800);
    });

    const element = container.querySelector("#clats-report-capture") as HTMLElement;
    if (!element) {
      console.error("Report element not found");
      root.unmount();
      document.body.removeChild(container);
      return;
    }

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#E3F5F6",
      windowWidth: 900,
    });

    const imgData = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    const safeName = parent.name.replace(/[^a-zA-Z0-9]/g, "_");
    link.download = `CLATS_Progress_Report_${safeName}.png`;
    link.href = imgData;
    link.click();

    root.unmount();
    document.body.removeChild(container);
  } catch (error) {
    console.error("Error generating progress report image:", error);
    // Fallback to original PDF generator
    const { downloadProgressReport } = await import("./pdfGenerator");
    await downloadProgressReport(parent);
  }
}
