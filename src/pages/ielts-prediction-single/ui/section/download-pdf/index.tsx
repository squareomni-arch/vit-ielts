import { IPracticeSingle } from "@/pages/ielts-practice-single/api";
import { PDFIcon } from "@/shared/ui/icons";
import { Button } from "antd";

function DownloadPDF({ quiz }: { quiz: IPracticeSingle }) {
  const pdfUrl = quiz.quizFields.pdf?.node.mediaItemUrl || undefined;
  return (
    <section className="space-y-6">
      <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold">
        📥 Download PDF
      </h2>
      <p className="font-semibold md:text-base">
        You can download a nice copy of the questions and answers for{" "}
        {quiz.title} here.
      </p>
      <div className="bg-gray-200 p-6 rounded-xl flex items-center">
        <div>
          <PDFIcon className="text-3xl" />
        </div>
        <p className="font-semibold text-base mx-3 line-clamp-1">
          {quiz.title}
        </p>
        <div className="ml-auto">
          <Button
            href={pdfUrl}
            target="_blank"
            icon={
              <span className="material-symbols-rounded !block">download</span>
            }
          />
        </div>
      </div>
    </section>
  );
}

export default DownloadPDF;
