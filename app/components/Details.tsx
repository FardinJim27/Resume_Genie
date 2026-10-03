import { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionHeader,
  AccordionItem,
} from "./Accordion";
import ScoreBadge from "./ScoreBadge";
import ResumeActionSuggestions from "~/components/ResumeActionSuggestions";
import ResumeFeedbackSection from "~/components/ResumeFeedbackSection";
import { cn } from "~/lib/utils";
import { FaTasks, FaListUl, FaRegCheckSquare } from "react-icons/fa";

const CategoryHeader = ({
  title,
  categoryScore,
}: {
  title: string;
  categoryScore: number;
}) => {
  return (
    <div className="flex flex-row gap-2 sm:gap-4 items-center py-1 sm:py-2">
      <p className="text-base sm:text-xl md:text-2xl font-semibold text-gray-900 dark:text-white">{title}</p>
      <ScoreBadge score={categoryScore} />
    </div>
  );
};

const CategoryContent = ({
  tips,
}: {
  tips: { type: "good" | "improve"; tip: string; explanation: string }[];
}) => {
  return (
    <div className="flex flex-col gap-3 sm:gap-4 items-center w-full">
      <div className="bg-gray-50 dark:bg-slate-800/80 w-full rounded-xl p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-4 border border-gray-100 dark:border-slate-700/60">
        {tips.map((tip, index) => (
          <div className="flex flex-row gap-2 items-center" key={index}>
            <img
              src={
                tip.type === "good" ? "/icons/check.svg" : "/icons/warning.svg"
              }
              alt="score"
              className="size-4 sm:size-5 flex-shrink-0"
            />
            <p className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-slate-300 font-medium">{tip.tip}</p>
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {tips.map((tip, index) => (
          <div
            key={index + tip.tip}
            className={cn(
              "flex flex-col gap-1.5 sm:gap-2 rounded-xl sm:rounded-2xl p-3.5 sm:p-4",
              tip.type === "good"
                ? "bg-green-50/70 dark:bg-emerald-950/40 border border-green-200 dark:border-emerald-800/60 text-green-800 dark:text-emerald-200"
                : "bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200",
            )}
          >
            <div className="flex flex-row gap-2 items-center">
              <img
                src={
                  tip.type === "good"
                    ? "/icons/check.svg"
                    : "/icons/warning.svg"
                }
                alt="score"
                className="size-4 sm:size-5 flex-shrink-0"
              />
              <p className="text-sm sm:text-base font-semibold">{tip.tip}</p>
            </div>
            <p className="text-xs sm:text-sm opacity-90 leading-relaxed pl-6">{tip.explanation}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export interface DetailsProps {
  feedback: Feedback;
  resumeId?: string;
  jobTitle?: string;
  companyName?: string;
}

const Details = ({
  feedback,
  resumeId = "default_resume",
  jobTitle = "Target Role",
  companyName = "Target Company",
}: DetailsProps) => {
  const [activeTab, setActiveTab] = useState<"actionable" | "cards" | "accordion">("actionable");

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* Top View Selector Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-1.5 bg-gray-100 dark:bg-slate-800/90 rounded-2xl border border-gray-200/60 dark:border-slate-700/60">
        <button
          type="button"
          onClick={() => setActiveTab("actionable")}
          className={`flex-1 sm:flex-initial py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === "actionable"
              ? "bg-white dark:bg-slate-700 text-amber-700 dark:text-amber-400 shadow-xs"
              : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200"
          }`}
        >
          <FaRegCheckSquare className="w-3.5 h-3.5 text-amber-500" />
          <span>Actionable Bullet Points</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("cards")}
          className={`flex-1 sm:flex-initial py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === "cards"
              ? "bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-xs"
              : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200"
          }`}
        >
          <FaTasks className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span>Interactive Suggestion Cards</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("accordion")}
          className={`flex-1 sm:flex-initial py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === "accordion"
              ? "bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-xs"
              : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200"
          }`}
        >
          <FaListUl className="w-3.5 h-3.5 text-gray-500 dark:text-slate-400" />
          <span>Category Breakdown View</span>
        </button>
      </div>

      {activeTab === "actionable" ? (
        <ResumeFeedbackSection
          feedback={feedback}
          resumeId={resumeId}
          jobTitle={jobTitle}
          companyName={companyName}
          showHeader={false}
        />
      ) : activeTab === "cards" ? (
        <ResumeActionSuggestions
          feedback={feedback}
          resumeId={resumeId}
          jobTitle={jobTitle}
          companyName={companyName}
        />
      ) : (
        <Accordion>
          <AccordionItem id="tone-style">
            <AccordionHeader itemId="tone-style">
              <CategoryHeader
                title="Tone & Style"
                categoryScore={feedback.toneAndStyle.score}
              />
            </AccordionHeader>
            <AccordionContent itemId="tone-style">
              <CategoryContent tips={feedback.toneAndStyle.tips} />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem id="content">
            <AccordionHeader itemId="content">
              <CategoryHeader
                title="Content"
                categoryScore={feedback.content.score}
              />
            </AccordionHeader>
            <AccordionContent itemId="content">
              <CategoryContent tips={feedback.content.tips} />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem id="structure">
            <AccordionHeader itemId="structure">
              <CategoryHeader
                title="Structure"
                categoryScore={feedback.structure.score}
              />
            </AccordionHeader>
            <AccordionContent itemId="structure">
              <CategoryContent tips={feedback.structure.tips} />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem id="skills">
            <AccordionHeader itemId="skills">
              <CategoryHeader
                title="Skills"
                categoryScore={feedback.skills.score}
              />
            </AccordionHeader>
            <AccordionContent itemId="skills">
              <CategoryContent tips={feedback.skills.tips} />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}
    </div>
  );
};

export default Details;
export { ResumeFeedbackSection };
