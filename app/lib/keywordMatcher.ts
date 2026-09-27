// Keyword taxonomy, extraction, and comparison engine for Job Descriptions vs Resumes

export interface KeywordAnalysisItem {
  id: string;
  keyword: string;
  category: "technical" | "tools" | "soft_skills" | "domain";
  priority: "critical" | "important" | "recommended";
  frequencyInJD: number;
  matched: boolean;
  matchCountInResume: number;
  suggestedBullet: string;
  whyItMatters: string;
}

export interface KeywordAnalysisResult {
  totalCount: number;
  matchedCount: number;
  missingCount: number;
  matchPercentage: number;
  criticalMissingCount: number;
  categories: {
    technical: { total: number; matched: number; percentage: number };
    tools: { total: number; matched: number; percentage: number };
    soft_skills: { total: number; matched: number; percentage: number };
    domain: { total: number; matched: number; percentage: number };
  };
  keywords: KeywordAnalysisItem[];
}

// Curated skills library with aliases & contexts
interface SkillDef {
  name: string;
  category: "technical" | "tools" | "soft_skills" | "domain";
  aliases?: string[];
  suggestedBullet: string;
  whyItMatters: string;
}

export const SKILL_LIBRARY: SkillDef[] = [
  // Languages & Core Tech
  {
    name: "TypeScript",
    category: "technical",
    aliases: ["ts"],
    suggestedBullet: "Engineered scalable type-safe modules using TypeScript, reducing production runtime bugs by 35%.",
    whyItMatters: "Top requirement for modern frontend and full-stack engineering roles.",
  },
  {
    name: "JavaScript",
    category: "technical",
    aliases: ["js", "es6", "es6+"],
    suggestedBullet: "Built responsive client applications with modern JavaScript (ES6+), optimizing bundle performance.",
    whyItMatters: "Fundamental baseline skill for web application development.",
  },
  {
    name: "React",
    category: "technical",
    aliases: ["react.js", "reactjs"],
    suggestedBullet: "Architected reusable React component libraries and custom hooks to streamline UI development.",
    whyItMatters: "Most widely demanded frontend library in ATS filters.",
  },
  {
    name: "Next.js",
    category: "technical",
    aliases: ["nextjs", "next.js 14", "next.js 15"],
    suggestedBullet: "Developed high-performance web applications leveraging Next.js SSR, ISR, and API route architectures.",
    whyItMatters: "Standard framework for modern enterprise React applications.",
  },
  {
    name: "Node.js",
    category: "technical",
    aliases: ["nodejs", "node"],
    suggestedBullet: "Designed and scaled backend microservices using Node.js and Express, supporting high-concurrency traffic.",
    whyItMatters: "Core runtime for full-stack JavaScript and API architectures.",
  },
  {
    name: "Python",
    category: "technical",
    aliases: ["py"],
    suggestedBullet: "Implemented automated data processing pipelines and RESTful backend services using Python.",
    whyItMatters: "Crucial for backend, automation, data analysis, and AI integrations.",
  },
  {
    name: "SQL",
    category: "technical",
    aliases: ["relational database", "rdbms"],
    suggestedBullet: "Optimized complex SQL queries and index strategies, improving query response latency by 40%.",
    whyItMatters: "Universal standard for data persistence and analytics querying.",
  },
  {
    name: "PostgreSQL",
    category: "technical",
    aliases: ["postgres", "pgsql"],
    suggestedBullet: "Managed PostgreSQL relational databases with automated migrations and relation modeling.",
    whyItMatters: "High-value open-source database frequently parsed by ATS filters.",
  },
  {
    name: "GraphQL",
    category: "technical",
    suggestedBullet: "Designed GraphQL schemas and resolvers to replace legacy endpoints, cutting payload sizes by 45%.",
    whyItMatters: "Demonstrates modern API querying and schema orchestration capabilities.",
  },
  {
    name: "REST API",
    category: "technical",
    aliases: ["restful", "rest api", "rest apis", "restful apis"],
    suggestedBullet: "Built and documented clean RESTful APIs following OpenAPI/Swagger industry standards.",
    whyItMatters: "Essential for integrating disparate web services and client-server workflows.",
  },
  {
    name: "Tailwind CSS",
    category: "technical",
    aliases: ["tailwindcss"],
    suggestedBullet: "Styled accessible, responsive, and cross-browser interfaces rapidly utilizing Tailwind CSS utility classes.",
    whyItMatters: "Leading styling standard for current frontend web teams.",
  },
  {
    name: "Docker",
    category: "tools",
    aliases: ["container", "containers", "containerization"],
    suggestedBullet: "Containerized multi-service applications using Docker and Docker Compose for consistent dev and prod environments.",
    whyItMatters: "Baseline DevOps container requirement across modern software teams.",
  },
  {
    name: "Kubernetes",
    category: "tools",
    aliases: ["k8s"],
    suggestedBullet: "Configured Kubernetes cluster deployments and ingress controllers to ensure 99.9% application uptime.",
    whyItMatters: "High-tier cloud infrastructure keyword with substantial ATS weight.",
  },
  {
    name: "AWS",
    category: "tools",
    aliases: ["amazon web services", "s3", "ec2", "lambda"],
    suggestedBullet: "Deployed serverless cloud infrastructure on AWS (Lambda, S3, CloudFront) minimizing infrastructure overhead.",
    whyItMatters: "Most common cloud infrastructure platform requested in job specs.",
  },
  {
    name: "CI/CD",
    category: "tools",
    aliases: ["continuous integration", "continuous deployment", "github actions"],
    suggestedBullet: "Established automated CI/CD deployment pipelines using GitHub Actions, decreasing release cycle times by 60%.",
    whyItMatters: "Key indicator of engineering maturity and automated deployment capability.",
  },
  {
    name: "Git",
    category: "tools",
    aliases: ["github", "gitlab", "version control"],
    suggestedBullet: "Managed team code repositories and branching workflows utilizing Git and structured pull request reviews.",
    whyItMatters: "Mandatory version control competency expected by all employers.",
  },
  {
    name: "Unit Testing",
    category: "tools",
    aliases: ["jest", "vitest", "cypress", "playwright", "tdd", "automated testing"],
    suggestedBullet: "Achieved 85%+ test coverage by implementing comprehensive unit and integration tests using Jest/Playwright.",
    whyItMatters: "Proves commitment to code quality, maintainability, and regression prevention.",
  },
  {
    name: "Agile",
    category: "tools",
    aliases: ["scrum", "sprints", "kanban", "jira"],
    suggestedBullet: "Collaborated in fast-paced two-week Agile/Scrum sprint cycles, consistently delivering committed deliverables.",
    whyItMatters: "Signals readiness to integrate seamlessly into product development workflows.",
  },
  {
    name: "Leadership",
    category: "soft_skills",
    aliases: ["team lead", "led", "leading", "guidance"],
    suggestedBullet: "Led cross-functional engineering initiatives, coordinating requirements across product, design, and QA.",
    whyItMatters: "Crucial for mid-level and senior roles demonstrating initiative and ownership.",
  },
  {
    name: "Mentorship",
    category: "soft_skills",
    aliases: ["mentoring", "mentored", "coaching"],
    suggestedBullet: "Mentored junior engineers through pair programming, architectural deep-dives, and code review standards.",
    whyItMatters: "Highlights team-building skills and senior-level positive multiplier effect.",
  },
  {
    name: "Cross-functional Collaboration",
    category: "soft_skills",
    aliases: ["collaboration", "cross-functional", "stakeholder management"],
    suggestedBullet: "Partnered closely with product managers and UX designers to translate complex business specs into technical roadmaps.",
    whyItMatters: "Validates communication effectiveness beyond pure coding tasks.",
  },
  {
    name: "Problem Solving",
    category: "soft_skills",
    aliases: ["analytical thinking", "troubleshooting", "root cause analysis"],
    suggestedBullet: "Conducted root cause investigations for critical production bottlenecks, successfully restoring SLA performance.",
    whyItMatters: "Consistently sought-after soft skill in technical hiring criteria.",
  },
  {
    name: "Performance Optimization",
    category: "domain",
    aliases: ["optimization", "web vitals", "lighthouse", "profiling"],
    suggestedBullet: "Audited and improved Core Web Vitals, elevating Lighthouse performance scores from 62 to 94.",
    whyItMatters: "Demonstrates high engineering standards, user-centricity, and cost efficiency.",
  },
  {
    name: "Security",
    category: "domain",
    aliases: ["owasp", "vulnerability", "authentication", "authorization", "rbac"],
    suggestedBullet: "Hardened application security through role-based access control (RBAC), CSRF protection, and OWASP audit remediation.",
    whyItMatters: "Critical concern for modern enterprise applications and compliance checks.",
  },
  {
    name: "Scalability",
    category: "domain",
    aliases: ["scalable", "high traffic", "high concurrency", "distributed systems"],
    suggestedBullet: "Architected distributed caching layers with Redis, enabling system to handle 10x traffic spikes seamlessly.",
    whyItMatters: "Distinguishes junior practitioners from experienced production engineers.",
  },
];

// Helper to escape regex
function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Check if a keyword exists in text
export function checkKeywordInText(text: string, keyword: string, aliases?: string[]): { matched: boolean; count: number } {
  if (!text) return { matched: false, count: 0 };

  const terms = [keyword, ...(aliases || [])];
  let totalCount = 0;

  for (const term of terms) {
    const escaped = escapeRegExp(term.trim());
    // Match word boundaries or non-alphanumeric separators
    const regex = new RegExp(`(?:^|[^a-zA-Z0-9#+.])${escaped}(?:$|[^a-zA-Z0-9#+.])`, "gi");
    const matches = text.match(regex);
    if (matches && matches.length > 0) {
      totalCount += matches.length;
    }
  }

  return { matched: totalCount > 0, count: totalCount };
}

// Extract keywords from Job Description and compare against Resume
export function analyzeJobDescriptionKeywords(
  jobDescription: string,
  resumeText: string = "",
  extractedSkillsFromResume: string[] = [],
): KeywordAnalysisResult {
  const jdClean = (jobDescription || "").toLowerCase();
  const resumeClean = (resumeText || "").toLowerCase();

  // Create a combined resume lookup string including skills
  const skillsBlob = extractedSkillsFromResume.join(" ").toLowerCase();
  const combinedResumeText = `${resumeClean} ${skillsBlob}`;

  const results: KeywordAnalysisItem[] = [];

  // 1. Scan curated skill library against Job Description
  for (const skill of SKILL_LIBRARY) {
    const jdCheck = checkKeywordInText(jobDescription, skill.name, skill.aliases);

    // If the keyword or any alias appears in the job description:
    if (jdCheck.matched) {
      // Check resume
      const resumeCheck = checkKeywordInText(combinedResumeText, skill.name, skill.aliases);

      // Determine priority:
      // High if mentioned >= 2 times or contains "must" / "required" / "qualifications" nearby
      let priority: "critical" | "important" | "recommended" = "recommended";
      if (jdCheck.count >= 2 || skill.category === "technical") {
        priority = "important";
      }
      if (
        jdCheck.count >= 3 ||
        jdClean.includes(`require ${skill.name.toLowerCase()}`) ||
        jdClean.includes(`required: ${skill.name.toLowerCase()}`) ||
        jdClean.includes(`must have ${skill.name.toLowerCase()}`) ||
        (skill.category === "technical" && jdCheck.count >= 2)
      ) {
        priority = "critical";
      }

      results.push({
        id: `kw_${skill.name.toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
        keyword: skill.name,
        category: skill.category,
        priority,
        frequencyInJD: jdCheck.count,
        matched: resumeCheck.matched,
        matchCountInResume: resumeCheck.count,
        suggestedBullet: skill.suggestedBullet,
        whyItMatters: skill.whyItMatters,
      });
    }
  }

  // 2. Dynamically extract extra capitalized buzzwords or tech acronyms from JD if not already covered
  const dynamicWordsRegex = /\b([A-Z][a-zA-Z0-9+#.]{2,}(?:\s+[A-Z][a-zA-Z0-9+#.]+)?)\b/g;
  const matches = jobDescription.match(dynamicWordsRegex) || [];
  const existingNames = new Set(results.map((r) => r.keyword.toLowerCase()));

  // Filter common false positives
  const IGNORE_WORDS = new Set([
    "the", "and", "with", "for", "you", "our", "will", "this", "that", "have",
    "role", "team", "company", "responsibilities", "requirements", "qualifications",
    "experience", "years", "work", "job", "candidate", "about", "we", "are",
    "equal", "opportunity", "employer", "benefits", "salary", "apply", "join",
    "looking", "strong", "ideal", "location", "hybrid", "remote", "full-time"
  ]);

  const candidateCounts: Record<string, number> = {};
  for (const m of matches) {
    const trimmed = m.trim();
    const lower = trimmed.toLowerCase();
    if (trimmed.length > 2 && !IGNORE_WORDS.has(lower) && !existingNames.has(lower)) {
      candidateCounts[trimmed] = (candidateCounts[trimmed] || 0) + 1;
    }
  }

  // Add top dynamic candidates that appear at least twice
  for (const [candidate, count] of Object.entries(candidateCounts)) {
    if (count >= 2 && results.length < 30) {
      const resumeCheck = checkKeywordInText(combinedResumeText, candidate);
      results.push({
        id: `kw_dyn_${candidate.toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
        keyword: candidate,
        category: "domain",
        priority: count >= 3 ? "critical" : "important",
        frequencyInJD: count,
        matched: resumeCheck.matched,
        matchCountInResume: resumeCheck.count,
        suggestedBullet: `Demonstrated hands-on expertise in ${candidate} to drive project execution and cross-team alignment.`,
        whyItMatters: `Repeated ${count} times in the job description as a key role expectation.`,
      });
    }
  }

  // If JD is very short or generic and fewer than 4 keywords were found, populate common baseline software terms
  if (results.length < 4) {
    const fallbackTerms = ["JavaScript", "React", "Git", "REST API", "Problem Solving"];
    for (const term of fallbackTerms) {
      if (!results.find((r) => r.keyword.toLowerCase() === term.toLowerCase())) {
        const def = SKILL_LIBRARY.find((s) => s.name === term);
        if (def) {
          const resumeCheck = checkKeywordInText(combinedResumeText, def.name, def.aliases);
          results.push({
            id: `kw_fallback_${def.name.toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
            keyword: def.name,
            category: def.category,
            priority: "recommended",
            frequencyInJD: 1,
            matched: resumeCheck.matched,
            matchCountInResume: resumeCheck.count,
            suggestedBullet: def.suggestedBullet,
            whyItMatters: def.whyItMatters,
          });
        }
      }
    }
  }

  // Sort: Critical missing first, then important missing, then matched
  results.sort((a, b) => {
    if (!a.matched && b.matched) return -1;
    if (a.matched && !b.matched) return 1;
    const priorityWeight = { critical: 3, important: 2, recommended: 1 };
    return priorityWeight[b.priority] - priorityWeight[a.priority];
  });

  const totalCount = results.length;
  const matchedCount = results.filter((r) => r.matched).length;
  const missingCount = totalCount - matchedCount;
  const matchPercentage = totalCount > 0 ? Math.round((matchedCount / totalCount) * 100) : 0;
  const criticalMissingCount = results.filter((r) => !r.matched && r.priority === "critical").length;

  const calculateCatStats = (cat: "technical" | "tools" | "soft_skills" | "domain") => {
    const items = results.filter((r) => r.category === cat);
    const tot = items.length;
    const m = items.filter((r) => r.matched).length;
    return {
      total: tot,
      matched: m,
      percentage: tot > 0 ? Math.round((m / tot) * 100) : 100,
    };
  };

  return {
    totalCount,
    matchedCount,
    missingCount,
    matchPercentage,
    criticalMissingCount,
    categories: {
      technical: calculateCatStats("technical"),
      tools: calculateCatStats("tools"),
      soft_skills: calculateCatStats("soft_skills"),
      domain: calculateCatStats("domain"),
    },
    keywords: results,
  };
}
