import { Container } from "@/shared/ui";
import { Button, Modal, Tooltip, notification } from "antd";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import dayjs from "dayjs";
import { IPracticeSingle } from "@/pages/ielts-practice-single/api";
import { AnswerFormValues, useExamContext } from "../../context";
import { useRouter } from "next/router";
import duration from "dayjs/plugin/duration";
import { useFormContext } from "react-hook-form";
import Link from "next/link";
import { ROUTES } from "@/shared/routes";

dayjs.extend(duration);

const OptionItem = ({
  icon,
  text,
  onClick,
  isPrimary = false,
}: {
  icon: string;
  text: string;
  onClick: () => void;
  isPrimary?: boolean;
}) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center justify-between text-left p-4 rounded-lg mb-3 ${
      isPrimary ? "bg-red-600 text-white" : "bg-gray-100 hover:bg-gray-200"
    }`}
  >
    <div className="flex items-center">
      <span className="material-symbols-rounded mr-3">{icon}</span>
      <span className="font-semibold">{text}</span>
    </div>
  </button>
);

function Header({ post }: { post: IPracticeSingle }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const {
    testID,
    testResult,
    isFormDisabled,
    handleSubmitAnswer,
    isNotesViewOpen,
    setIsNotesViewOpen,
    timer,
    setTimer,
    selectedTextSize,
    setSelectedTextSize,
    isReady,
  } = useExamContext();
  const { getValues } = useFormContext<AnswerFormValues>();
  const { handleSubmit } = useFormContext<AnswerFormValues>();
  const router = useRouter();

  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [optionsView, setOptionsView] = useState("main");
  const [isSaving, setIsSaving] = useState(false);
  const [isRetaking, setIsRetaking] = useState(false);

  const handleManualSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const response = await fetch("/api/test-flow/save-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testId: testID,
          answers: JSON.stringify(getValues()),
          timeLeft: timer?.format("mm:ss") || "00:00",
        }),
      });
      
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "Lưu thất bại");

      notification.success({
        message: "Thành công",
        description: "Đã lưu bản nháp bài làm của bạn.",
        placement: "topRight",
      });
    } catch (error: any) {
      console.error("Manual Save Error:", error);
      notification.error({
        message: "Lỗi",
        description: error?.message || "Không thể lưu bản nháp. Vui lòng thử lại.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const textSizes = [
    { key: "Regular", name: "Regular" },
    { key: "large", name: "Large" },
    { key: "xlarge", name: "Extra Large" },
  ];

  // Use refs to avoid stale closures and prevent re-creating intervals
  const isFormDisabledRef = useRef(isFormDisabled);
  const handleSubmitRef = useRef(handleSubmit);
  const handleSubmitAnswerRef = useRef(handleSubmitAnswer);

  useEffect(() => { isFormDisabledRef.current = isFormDisabled; }, [isFormDisabled]);
  useEffect(() => { handleSubmitRef.current = handleSubmit; }, [handleSubmit]);
  useEffect(() => { handleSubmitAnswerRef.current = handleSubmitAnswer; }, [handleSubmitAnswer]);

  // Initialize timer once
  useEffect(() => {
    if (!timer && !isReady) {
      const timeLeft = testResult.timeLeft?.toString().split(":") || [
        post.quizFields.time,
      ];
      const d = dayjs.duration({
        minutes: Number(timeLeft[0]) || post.quizFields.time,
        seconds: Number(timeLeft[1]) || 0,
      });
      setTimer(d);
    }
  }, [timer, isReady, testResult.timeLeft, post.quizFields.time, setTimer]);

  // Countdown timer - only start when isReady, does NOT depend on timer value
  // Timer continues into negative when time runs out (no auto-submit)
  useEffect(() => {
    if (!isReady) return;

    const interval = setInterval(() => {
      if (isFormDisabledRef.current) {
        clearInterval(interval);
        return;
      }

      setTimer((prev) => {
        if (!prev) return prev;
        return prev.subtract(1, "second");
      });
    }, 1000);

    return () => clearInterval(interval);
    // Only depend on isReady - NOT on timer
  }, [isReady, setTimer]);

  const handleNotesView = () => {
    if (!setIsNotesViewOpen) return;
    if (isNotesViewOpen) {
      setIsNotesViewOpen(false);
    } else {
      setIsNotesViewOpen(true);
    }
  };

  const getBackUrl = () => {
    const type = post?.quizFields?.type?.[0];
    const skill = post?.quizFields?.skill?.[0];
    if (type === "academic" || type === "general") {
      return ROUTES.EXAM.ARCHIVE;
    }
    if (skill === "listening") {
      return ROUTES.PRACTICE.ARCHIVE_LISTENING;
    }
    if (skill === "reading") {
      return ROUTES.PRACTICE.ARCHIVE_READING;
    }
    return ROUTES.HOME;
  };

  return (
    <>
      {/* Full-screen loading overlay for retake */}
      {isRetaking && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm">
          <span className="material-symbols-rounded text-[48px] text-[#d94a56] animate-spin">refresh</span>
          <p className="mt-4 text-base font-semibold text-gray-700">Đang chuẩn bị bài thi mới...</p>
        </div>
      )}

      <header className="py-2 bg-white shadow z-20 px-[16px]">
        <Container className="max-w-none">
          <div className="flex items-center">
            <div className="md:w-1/2">
              <div className="flex">
                <div
                  title="Home"
                  className="h-10 md:h-12 aspect-[750/449] relative duration-300 flex-shrink-0"
                >
                  <Link href="/">
                    <Image
                      min-width="160px"
                      sizes="100%"
                      alt="logo"
                      src="/logo.png"
                      priority
                      fill
                      className="object-contain"
                    />
                  </Link>
                </div>

                <div className="title-wrap ml-[15px]">
                  <h2 className="font-bold text-base">{post.title}</h2>

                  <div className="flex items-center">
                    <span className={`font-medium text-sm ${timer && timer.asSeconds() < 0 ? 'text-gray-400' : 'text-dark'}`}>
                      {Number(post.quizFields.time) < 0
                        ? "No time limit"
                        : timer
                          ? `${Math.ceil(timer.asSeconds() / 60)} minutes remaining`
                          : "0 minutes remaining"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 md:w-1/2 md:flex-none">
              <div className="flex items-center justify-end space-x-3 md:space-x-6">
                {isFormDisabled && (
                  <>
                    <Link
                      href={getBackUrl()}
                      className="flex flex-col md:flex-row items-center gap-1 text-[#222] hover:text-[#d94a56] font-medium transition-colors"
                    >
                      <span className="material-symbols-rounded bold block! text-[20px] md:text-[24px]!">arrow_back</span>
                      <span className="hidden lg:inline text-sm whitespace-nowrap">Quay lại</span>
                    </Link>

                    <button
                      type="button"
                      disabled={isRetaking}
                      onClick={() => {
                        setIsRetaking(true);
                        const url = ROUTES.TAKE_THE_TEST(post.slug);
                        window.location.href = `${url}?retake=true`;
                      }}
                      className="flex flex-col md:flex-row items-center gap-1 text-[#222] hover:text-[#d94a56] font-medium transition-colors disabled:opacity-50"
                    >
                      <span className={`material-symbols-rounded bold block! text-[20px] md:text-[24px]! ${isRetaking ? "animate-spin" : ""}`}>refresh</span>
                      <span className="hidden lg:inline text-sm whitespace-nowrap">{isRetaking ? "Đang tải..." : "Làm lại"}</span>
                    </button>
                  </>
                )}

                <div className="w-[1px] h-[24px] bg-gray-300 hidden md:block mx-2"></div>

                <Image
                  width={28}
                  height={24}
                  sizes="100%"
                  alt="logo"
                  src="/wifi.png"
                  className="hidden md:block"
                  priority
                />

                {/* <Tooltip title="Lưu nháp" className="hidden md:block">
                  <Button
                    className="p-[0] border-[0] shadow-[0]"
                    onClick={handleManualSave}
                    loading={isSaving}
                  >
                    <span className="material-symbols-rounded bold block! text-[24px]! text-[#222]">
                      save
                    </span>
                  </Button>
                </Tooltip> */}

                <Tooltip title="Open Notes" className="hidden md:block">
                  <Button
                    className="p-[0] border-[0] shadow-[0]"
                    onClick={handleNotesView}
                  >
                    <span className="material-symbols-rounded bold block! text-[24px]! text-[#222]">
                      assignment
                    </span>
                  </Button>
                </Tooltip>

                <Button
                  className="p-[0] border-[0] shadow-[0]"
                  onClick={() => setIsOptionsOpen(true)}
                >
                  <div className="hambuger">
                    <div className="bar"></div>
                    <div className="bar"></div>
                    <div className="bar"></div>
                  </div>
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </header>

      <Modal
        open={isOptionsOpen}
        onCancel={() => {
          setIsOptionsOpen(false);
          setTimeout(() => setOptionsView("main"), 200);
        }}
        footer={null}
        closable={true}
        closeIcon={
          <Image
            width={18}
            height={18}
            sizes="100%"
            alt="logo"
            src="/bold-close.png"
            className="mr-[35px] mt-[5px]"
            priority
          />
        }
        width="100%"
        wrapClassName="fullscreen-modal"
        title={
          optionsView === "main" ? (
            <h3 className="text-[27px] font-[500] text-center mt-[-2px]">
              Options
            </h3>
          ) : (
            <div className="relative flex justify-center items-center h-full ml-[-16px] mt-[-5px]">
              <button
                onClick={() => setOptionsView("main")}
                className="absolute left-0 flex gap-[10px] items-center text-gray-600 hover:text-black cursor-pointer"
              >
                <Image
                  width={17}
                  height={25}
                  sizes="100%"
                  src="/bold-arrow.png"
                  alt="icon"
                  className="mt-[-3px] option-icon"
                  priority
                />
                <span className="font-[500] text-[27px] text-[#000]  popup-title">
                  Options
                </span>
              </button>
              <h3 className="text-[27px] font-[500] text-center  popup-title">
                Text size
              </h3>
            </div>
          )
        }
        transitionName=""
        maskTransitionName=""
      >
        <div className="max-w-[700px] mx-auto mt-4">
          {optionsView === "main" && (
            <div>
              {/* ... code cho view main không đổi ... */}
              <div className="go-submit cursor-pointer popup-bar-item">
                <div className="flex items-center gap-[25px]">
                  <Image
                    width={28}
                    height={24}
                    className="icon-left"
                    sizes="100%"
                    alt="logo"
                    src="/icon-plane.png"
                    priority
                  />
                  <div className="title">Go to submission page</div>
                </div>
                <Image
                  width={28}
                  height={24}
                  className="icon-right"
                  sizes="100%"
                  alt="logo"
                  src="/arrow-right.png"
                  priority
                />
              </div>
              <div className="tool-group">
                <div
                  className="tool-box  cursor-pointer popup-bar-item"
                  onClick={() => setOptionsView("textSize")}
                >
                  <div className="flex items-center gap-[25px]">
                    <Image
                      width={28}
                      height={24}
                      className="icon-left"
                      sizes="100%"
                      alt="logo"
                      src="/text-size-icon.png"
                      priority
                    />
                    <div className="title">Text size</div>
                  </div>
                  <Image
                    width={28}
                    height={24}
                    className="icon-right"
                    sizes="100%"
                    alt="logo"
                    src="/arrow-right.png"
                    priority
                  />
                </div>
              </div>
            </div>
          )}

          {/* ▼▼▼ BẮT ĐẦU THAY ĐỔI TẠI ĐÂY ▼▼▼ */}
          {optionsView === "textSize" && (
            <div className="border border-[#c5c5c5] rounded-[4px] overflow-hidden mt-[30px]">
              {textSizes.map((size) => (
                <button
                  key={size.key}
                  onClick={() => setSelectedTextSize(size.key)}
                  className="w-full flex items-center text-left px-[36px] py-[27px] border-b border-gray-300 last:border-b-0 hover:bg-gray-100 transition-colors"
                >
                  <span
                    className={`material-symbols-rounded check-size xbold mr-[25px] transition-opacity ${
                      selectedTextSize === size.key
                        ? "opacity-100"
                        : "opacity-0"
                    }`}
                  >
                    check
                  </span>
                  <span className="text-[18px] size-text">{size.name}</span>
                </button>
              ))}
            </div>
          )}
          {/* ▲▲▲ KẾT THÚC THAY ĐỔI TẠI ĐÂY ▲▲▲ */}
        </div>
      </Modal>

      <Modal
        title="Quit"
        open={isModalOpen}
        onOk={() => {
          router.push("/");
          setIsModalOpen(false);
        }}
        onCancel={() => setIsModalOpen(false)}
        transitionName=""
        maskTransitionName=""
      >
        <p>Are you sure you want to quit?</p>
      </Modal>
    </>
  );
}

export default Header;
