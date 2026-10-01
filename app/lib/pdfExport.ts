import { jsPDF } from "jspdf";

export interface ExportReportOptions {
  resumeId: string;
  feedback: Feedback;
  companyName?: string;
  jobTitle?: string;
  jobDescription?: string;
  careerGrowth?: any;
}

/**
 * Generates a multi-page, executive-grade PDF audit report
 * of the resume analysis and triggers an immediate download.
 */
export async function exportResumeAnalysisToPDF({
  resumeId,
  feedback,
  companyName = "Target Company",
  jobTitle = "Target Role",
  jobDescription = "",
  careerGrowth = null,
}: ExportReportOptions): Promise<string> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let currentY = margin;

  const primaryColor = [15, 23, 42]; // Slate 900
  const accentColor = [217, 119, 6]; // Amber 600
  const emeraldColor = [16, 185, 129]; // Emerald 500
  const roseColor = [225, 29, 72]; // Rose 600
  const textDark = [30, 41, 59]; // Slate 800
  const textMuted = [100, 116, 139]; // Slate 500
  const bgCard = [248, 250, 252]; // Slate 50
  const borderCard = [226, 232, 240]; // Slate 200

  // Helper for adding new page if needed
  const ensureSpace = (neededHeight: number) => {
    if (currentY + neededHeight > pageHeight - margin - 12) {
      doc.addPage();
      currentY = margin;
      drawPageBorder();
    }
  };

  const drawPageBorder = () => {
    // Subtle top accent bar
    doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.rect(margin, margin - 4, contentWidth, 1.5, "F");
  };

  // Draw header accent on page 1
  drawPageBorder();

  // --- HEADER SECTION ---
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(margin, currentY, contentWidth, 24, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("RESUME ANALYSIS & ATS AUDIT REPORT", margin + 6, currentY + 10);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(226, 232, 240);
  doc.text(
    "Automated Comprehensive Assessment • ATS Readiness • Actionable Feedback",
    margin + 6,
    currentY + 17,
  );

  currentY += 28;

  // --- AUDIT METADATA CARD ---
  doc.setFillColor(bgCard[0], bgCard[1], bgCard[2]);
  doc.setDrawColor(borderCard[0], borderCard[1], borderCard[2]);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, currentY, contentWidth, 22, 2, 2, "FD");

  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.setFontSize(9);

  // Column 1: Role & Company
  doc.setFont("helvetica", "bold");
  doc.text("Target Role:", margin + 5, currentY + 7);
  doc.setFont("helvetica", "normal");
  doc.text(jobTitle, margin + 28, currentY + 7);

  doc.setFont("helvetica", "bold");
  doc.text("Company:", margin + 5, currentY + 15);
  doc.setFont("helvetica", "normal");
  doc.text(companyName, margin + 28, currentY + 15);

  // Column 2: Date & Report ID
  const dateStr = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  doc.setFont("helvetica", "bold");
  doc.text("Generated:", margin + 100, currentY + 7);
  doc.setFont("helvetica", "normal");
  doc.text(dateStr, margin + 122, currentY + 7);

  doc.setFont("helvetica", "bold");
  doc.text("Audit ID:", margin + 100, currentY + 15);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(resumeId.slice(0, 18) + (resumeId.length > 18 ? "..." : ""), margin + 122, currentY + 15);

  currentY += 28;

  // --- EXECUTIVE SCORES RIBBON ---
  const overall = feedback.overallScore ?? feedback.ATS?.score ?? 0;
  const ats = feedback.ATS?.score ?? overall;
  const toneScore = feedback.toneAndStyle?.score ?? 0;
  const contentScore = feedback.content?.score ?? 0;
  const structureScore = feedback.structure?.score ?? 0;
  const skillsScore = feedback.skills?.score ?? 0;

  const atsVerdict =
    ats >= 80 ? "ATS Ready (High Pass Probability)" : ats >= 60 ? "Moderate ATS Risk (Review Fixes)" : "High ATS Rejection Risk";

  const kpiBoxWidth = (contentWidth - 6) / 2;

  // Box 1: Overall Score
  doc.setFillColor(bgCard[0], bgCard[1], bgCard[2]);
  doc.setDrawColor(borderCard[0], borderCard[1], borderCard[2]);
  doc.roundedRect(margin, currentY, kpiBoxWidth, 26, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text("OVERALL RESUME SCORE", margin + 5, currentY + 7);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(`${overall}/100`, margin + 5, currentY + 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  const overallLabel = overall >= 80 ? "Excellent Candidate Profile" : overall >= 60 ? "Competitive Profile" : "Needs Revision";
  doc.text(overallLabel, margin + 5, currentY + 23);

  // Box 2: ATS Match Score
  doc.setFillColor(bgCard[0], bgCard[1], bgCard[2]);
  doc.roundedRect(margin + kpiBoxWidth + 6, currentY, kpiBoxWidth, 26, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text("ATS COMPATIBILITY SCORE", margin + kpiBoxWidth + 11, currentY + 7);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  if (ats >= 80) doc.setTextColor(emeraldColor[0], emeraldColor[1], emeraldColor[2]);
  else if (ats >= 60) doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
  else doc.setTextColor(roseColor[0], roseColor[1], roseColor[2]);
  doc.text(`${ats}%`, margin + kpiBoxWidth + 11, currentY + 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(atsVerdict, margin + kpiBoxWidth + 11, currentY + 23);

  currentY += 32;

  // --- PILLAR SCORES GRID ---
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(margin, currentY, contentWidth, 6, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text("CORE EVALUATION PILLARS", margin + 4, currentY + 4.2);

  currentY += 8;

  const pillarCols = [
    { name: "Tone & Style", score: toneScore },
    { name: "Content Quality", score: contentScore },
    { name: "Structure & Layout", score: structureScore },
    { name: "Skills & Keywords", score: skillsScore },
  ];
  const colWidth = (contentWidth - 6) / 4;

  pillarCols.forEach((col, idx) => {
    const x = margin + idx * (colWidth + 2);
    doc.setFillColor(bgCard[0], bgCard[1], bgCard[2]);
    doc.setDrawColor(borderCard[0], borderCard[1], borderCard[2]);
    doc.roundedRect(x, currentY, colWidth, 14, 1.5, 1.5, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text(col.name, x + 3, currentY + 5);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.text(`${col.score}/100`, x + 3, currentY + 11);
  });

  currentY += 20;

  // --- SECTION: ATS AUDIT BREAKDOWN ---
  ensureSpace(40);
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(margin, currentY, contentWidth, 6, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text("1. ATS SCREENING & SYSTEM COMPLIANCE", margin + 4, currentY + 4.2);

  currentY += 9;

  if (feedback.ATS?.tips && feedback.ATS.tips.length > 0) {
    feedback.ATS.tips.forEach((item) => {
      ensureSpace(12);
      const isGood = item.type === "good";
      const icon = isGood ? "[PASS]" : "[FIX]";
      const iconColor = isGood ? emeraldColor : roseColor;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(iconColor[0], iconColor[1], iconColor[2]);
      doc.text(icon, margin + 2, currentY + 3);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(textDark[0], textDark[1], textDark[2]);
      const lines = doc.splitTextToSize(item.tip, contentWidth - 18);
      doc.text(lines, margin + 16, currentY + 3);

      currentY += Math.max(lines.length * 4 + 2, 7);
    });
  } else {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text("No specific ATS parsing flags recorded.", margin + 4, currentY + 3);
    currentY += 8;
  }

  currentY += 4;

  // --- HELPER FUNCTION FOR CATEGORIES ---
  const renderCategory = (
    title: string,
    score: number,
    tips?: { type: "good" | "improve"; tip: string; explanation?: string }[],
  ) => {
    ensureSpace(35);
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(margin, currentY, contentWidth, 6, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.text(`${title.toUpperCase()} (Score: ${score}/100)`, margin + 4, currentY + 4.2);

    currentY += 9;

    if (!tips || tips.length === 0) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
      doc.text("No observations recorded for this section.", margin + 4, currentY + 3);
      currentY += 8;
      return;
    }

    tips.forEach((item) => {
      const isGood = item.type === "good";
      const badge = isGood ? "STRENGTH" : "ACTION REQUIRED";
      const badgeColor = isGood ? emeraldColor : roseColor;

      const tipLines = doc.splitTextToSize(item.tip, contentWidth - 36);
      const explanationLines = item.explanation
        ? doc.splitTextToSize(item.explanation, contentWidth - 36)
        : [];

      const blockHeight = tipLines.length * 4 + explanationLines.length * 3.5 + 8;
      ensureSpace(blockHeight);

      // Card container
      doc.setFillColor(bgCard[0], bgCard[1], bgCard[2]);
      doc.setDrawColor(borderCard[0], borderCard[1], borderCard[2]);
      doc.roundedRect(margin, currentY, contentWidth, blockHeight - 2, 1.5, 1.5, "FD");

      // Badge
      doc.setFillColor(badgeColor[0], badgeColor[1], badgeColor[2]);
      doc.roundedRect(margin + 3, currentY + 3, 26, 4.5, 1, 1, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      doc.text(badge, margin + 4.5, currentY + 6.3);

      // Main tip
      doc.setTextColor(textDark[0], textDark[1], textDark[2]);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text(tipLines, margin + 32, currentY + 6.3);

      let textY = currentY + 6.3 + tipLines.length * 4;

      // Explanation
      if (item.explanation) {
        doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.text(explanationLines, margin + 32, textY);
      }

      currentY += blockHeight + 1.5;
    });

    currentY += 4;
  };

  // --- SECTIONS ---
  renderCategory(
    "2. Content & Impact Quality",
    contentScore,
    feedback.content?.tips,
  );

  renderCategory(
    "3. Tone & Executive Presence",
    toneScore,
    feedback.toneAndStyle?.tips,
  );

  renderCategory(
    "4. Structure & Layout Flow",
    structureScore,
    feedback.structure?.tips,
  );

  renderCategory(
    "5. Skills & Keyword Optimization",
    skillsScore,
    feedback.skills?.tips,
  );

  // --- CAREER GROWTH BENCHMARK SECTION (If available) ---
  if (careerGrowth?.candidateProfile || careerGrowth?.growthRoadmap) {
    ensureSpace(45);
    doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.rect(margin, currentY, contentWidth, 6, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.text("6. CAREER GROWTH & MARKET BENCHMARKS", margin + 4, currentY + 4.2);

    currentY += 9;

    if (careerGrowth.candidateProfile) {
      const p = careerGrowth.candidateProfile;
      ensureSpace(22);
      doc.setFillColor(bgCard[0], bgCard[1], bgCard[2]);
      doc.roundedRect(margin, currentY, contentWidth, 20, 1.5, 1.5, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(textDark[0], textDark[1], textDark[2]);
      doc.text(`Estimated Level: ${p.currentEstimatedLevel || "Senior"}`, margin + 4, currentY + 6);
      doc.text(`Market Demand: ${p.marketDemandRating || "High"}`, margin + 65, currentY + 6);
      doc.text(`Role Fit Score: ${p.targetFitScore || ats}%`, margin + 120, currentY + 6);

      if (p.experienceSummary) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
        const sumLines = doc.splitTextToSize(p.experienceSummary, contentWidth - 8);
        doc.text(sumLines.slice(0, 2), margin + 4, currentY + 13);
      }
      currentY += 24;
    }

    if (Array.isArray(careerGrowth.growthRoadmap) && careerGrowth.growthRoadmap.length > 0) {
      careerGrowth.growthRoadmap.slice(0, 3).forEach((item: any) => {
        ensureSpace(16);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(textDark[0], textDark[1], textDark[2]);
        doc.text(`• ${item.milestoneTitle || "Growth Milestone"} (${item.timeline || "Phase 1"})`, margin + 4, currentY + 4);

        if (item.focusAreas && Array.isArray(item.focusAreas)) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(7.5);
          doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
          doc.text(`Key Focus: ${item.focusAreas.join(", ")}`, margin + 8, currentY + 9);
        }
        currentY += 12;
      });
    }
  }

  // --- FOOTER ON ALL PAGES ---
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text(
      `AI Resume Genie • Confidential Candidate Audit Report • Page ${i} of ${totalPages}`,
      margin,
      pageHeight - 6,
    );
    doc.text(
      `Date: ${dateStr}`,
      pageWidth - margin - 22,
      pageHeight - 6,
    );
  }

  // --- SANITIZE FILENAME & DOWNLOAD ---
  const safeJob = jobTitle.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 20);
  const safeCompany = companyName.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 20);
  const filename = `Resume_Analysis_${safeJob}_${safeCompany}_Report.pdf`;

  doc.save(filename);
  return filename;
}
