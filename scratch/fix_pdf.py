import re

with open('src/utils/pdfGenerator.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add fetchImageAsBase64
helper_code = '''
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
'''
content = content.replace('// Fetch helper to register custom font in jsPDF', helper_code + '\n// Fetch helper to register custom font in jsPDF')

# 2. Add logo fetching to downloadProgressReport
logo_fetch_code = '''
  const children = parent.children || [];
  const liveDateTime = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });

  // Fetch logo
  const logoBase64 = await fetchImageAsBase64("/logo-3.png");
'''
content = content.replace(
'''  const children = parent.children || [];
  const liveDateTime = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });''', logo_fetch_code)

# 3. Fix the footer for NULL state
null_footer_old = '''    // Left Icon and Brand Label (Image 2 style vector recreation)
    doc.setFont("helvetica", "normal");
    doc.setFontSize(14);
    doc.setTextColor(46, 196, 182); // Vibrant branding turquoise
    doc.text("🤖", 15, 287);
    
    drawText(doc, "CLATS", 23, 2855, { fontSize: 12, fontStyle: "bold", color: [46, 196, 182], hasMontserrat });
    drawText(doc, "Children Learning AI Technology Solution", 23, 289.5, { fontSize: 8, color: [148, 163, 184], hasMontserrat });

    // Right page information
    drawText(doc, `CLATS Progress Report  •  ${liveDateTime}`, 195, 287, { fontSize: 9, color: [255, 255, 255], align: "right", hasMontserrat });'''

null_footer_new = '''    if (logoBase64) {
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
    drawText(doc, `CLATS Progress Report  •  ${liveDateTime}`, 195, 285, { fontSize: 8.5, color: [255, 255, 255], align: "right", hasMontserrat });'''

content = content.replace(null_footer_old, null_footer_new)

# 4. Fix footer for Populated state
pop_footer_old = '''    // Recreate the visual identity representation in Image Reference 2
    // Left: (🤖) CLATS • Tagline: Children Learning AI Technology Solution
    doc.setFont("helvetica", "normal");
    doc.setFontSize(14);
    doc.setTextColor(46, 196, 182); // Turquoise brand signature
    doc.text("🤖", 15, 287);
    
    drawText(doc, "CLATS", 23, 285.5, { fontSize: 12, fontStyle: "bold", color: [46, 196, 182], hasMontserrat });
    drawText(doc, "Children Learning AI Technology Solution", 23, 289.5, { fontSize: 8, color: [148, 163, 184], hasMontserrat });

    // Right side: Progress report name and active student designation
    drawText(doc, `CLATS Progress Report  •  STUDENT: ${child.name.toUpperCase()}`, 195, 287, { fontSize: 9, color: [255, 255, 255], align: "right", hasMontserrat });'''

pop_footer_new = '''    if (logoBase64) {
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
    drawText(doc, `CLATS Progress Report  •  STUDENT: ${child.name.toUpperCase()}`, 195, 285, { fontSize: 8.5, color: [255, 255, 255], align: "right", hasMontserrat });'''

content = content.replace(pop_footer_old, pop_footer_new)

# 5. Fix overlapping table layout
table_header_old = '''    drawText(doc, "Milestones:", 14, tableHeaderY + 5.5, { fontSize: 7.2, fontStyle: "bold", color: [255, 255, 255], maxWidth: 54, hasMontserrat });
    drawText(doc, "Project Status:", 72, tableHeaderY + 5.5, { fontSize: 7.2, fontStyle: "bold", color: [255, 255, 255], maxWidth: 22, hasMontserrat });
    drawText(doc, "Expected:", 98, tableHeaderY + 5.5, { fontSize: 7.2, fontStyle: "bold", color: [255, 255, 255], maxWidth: 18, hasMontserrat });
    drawText(doc, "Actual Standing:", 118, tableHeaderY + 5.5, { fontSize: 7.2, fontStyle: "bold", color: [255, 255, 255], maxWidth: 22, hasMontserrat });'''

table_header_new = '''    drawText(doc, "Milestones:", 14, tableHeaderY + 5.5, { fontSize: 7.2, fontStyle: "bold", color: [255, 255, 255], maxWidth: 58, hasMontserrat });
    drawText(doc, "Project Status:", 74, tableHeaderY + 5.5, { fontSize: 7.2, fontStyle: "bold", color: [255, 255, 255], maxWidth: 22, hasMontserrat });
    drawText(doc, "Expected:", 99, tableHeaderY + 5.5, { fontSize: 7.2, fontStyle: "bold", color: [255, 255, 255], maxWidth: 18, hasMontserrat });
    drawText(doc, "Actual Standing:", 119, tableHeaderY + 5.5, { fontSize: 7.2, fontStyle: "bold", color: [255, 255, 255], maxWidth: 22, hasMontserrat });'''

content = content.replace(table_header_old, table_header_new)

table_row_old = '''      drawText(doc, milestone.unit, 14, crtY + 7, { fontSize: 7.2, fontStyle: "bold", color: [19, 34, 43], maxWidth: 54, hasMontserrat });
      drawText(doc, milestone.status, 72, crtY + 7, { fontSize: 7.2, fontStyle: "bold", color: milestone.theme as [number, number, number], maxWidth: 22, hasMontserrat });
      drawText(doc, milestone.expected, 98, crtY + 7, { fontSize: 7.2, color: [100, 116, 139], maxWidth: 18, hasMontserrat });
      drawText(doc, milestone.actual, 118, crtY + 7, { fontSize: 7.2, fontStyle: "bold", color: [19, 34, 43], maxWidth: 22, hasMontserrat });'''

table_row_new = '''      drawText(doc, milestone.unit, 14, crtY + 6.5, { fontSize: 7.2, fontStyle: "bold", color: [19, 34, 43], maxWidth: 58, hasMontserrat });
      drawText(doc, milestone.status, 74, crtY + 6.5, { fontSize: 7.2, fontStyle: "bold", color: milestone.theme as [number, number, number], maxWidth: 22, hasMontserrat });
      drawText(doc, milestone.expected, 99, crtY + 6.5, { fontSize: 7.2, color: [100, 116, 139], maxWidth: 18, hasMontserrat });
      drawText(doc, milestone.actual, 119, crtY + 6.5, { fontSize: 7.2, fontStyle: "bold", color: [19, 34, 43], maxWidth: 22, hasMontserrat });'''

content = content.replace(table_row_old, table_row_new)

# Increase row height from 11 to 12
content = content.replace("const rowHeightMetric = 11;", "const rowHeightMetric = 11.8;")

with open('src/utils/pdfGenerator.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print('Updated src/utils/pdfGenerator.ts')
