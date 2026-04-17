import { useState } from "react";
import { TestCard, TestCardProps } from "@/shared/ui/ds/molecules/test-card/test-card";
import { useLatestTestScore } from "../hooks/useLatestTestScore";
import { TestHistoryModal } from "./test-history-modal";

export type TestCardWithScoreProps = TestCardProps & {
  quizId: string;
};

export const TestCardWithScore = ({ quizId, title, score, ...props }: TestCardWithScoreProps) => {
  const { score: latestScore, scoreClassName } = useLatestTestScore(quizId);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  return (
    <>
      <TestCard 
        {...props} 
        title={title}
        score={latestScore} 
        scoreClassName={scoreClassName}
        onScoreClick={latestScore !== undefined ? () => setIsModalOpen(true) : undefined}
      />
      <TestHistoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        quizId={quizId}
        title={title}
      />
    </>
  );
};
