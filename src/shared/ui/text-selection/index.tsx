// file: .../shared/ui/index.tsx (TextSelectionProvider - FULL CODE ĐÃ SỬA)

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { Button, Input, Tooltip } from "antd";
import { uniqueId } from "lodash";
import {
  MarkerClearIcon,
  MarkerIcon,
  NoteClearIcon,
  NoteIcon,
} from "@/shared/ui/icons";
import { useExamContext, HighlightItem } from "@/pages/take-the-test/context";

interface TooltipPosition { x: number; y: number; }
interface Note { nodeId: string; text: string; nodeContent: string; }
interface Options { ID: string; HIGHLIGHT_CLASS: string; UNDERLINE_CLASS: string; HIGHLIGHT_COLOR: string; UNDERLINE_STYLE: string; }

interface TextSelectionContextType {
  tooltip: { position: TooltipPosition; visible: boolean };
  selectedHighlightId: string | null;
  selectedUnderlineId: string | null;
  currentSelection: Note | null;
  setCurrentSelection: React.Dispatch<React.SetStateAction<Note | null>>;
  notes: Note[];
  handleHighlight: () => void;
  handleNote: () => void;
  removeHighlight: () => void;
  removeUnderline: (nodeId?: string) => void;
  handleNoteSubmit: (value: string, isEdit?: Note | false) => void;
  tooltipRef: React.RefObject<HTMLDivElement | null>;
  options: Options;
}

const TextSelectionContext = createContext<TextSelectionContextType | undefined>(undefined);

export const useTextSelectionContext = () => {
  const context = useContext(TextSelectionContext);
  if (!context) return null;
  return context;
};

export const TextSelectionProvider = ({
  children,
  options = {
    ID: "sandbox",
    HIGHLIGHT_CLASS: "highlighted cursor-pointer",
    UNDERLINE_CLASS: "underlined cursor-pointer text-primary font-semibold",
    HIGHLIGHT_COLOR: "yellow",
    UNDERLINE_STYLE: "underline",
  },
}: {
  children: React.ReactNode;
  options?: Options;
}) => {
  const {
    ID: SANDBOX_ID,
    HIGHLIGHT_CLASS,
    UNDERLINE_CLASS,
    HIGHLIGHT_COLOR,
    UNDERLINE_STYLE,
  } = options;

  const { part, savedPassageData, setSavedPassageData, setIsNotesViewOpen } = useExamContext();

  const tooltipRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState({ position: { x: 0, y: 0 }, visible: false });
  const [selectedHighlightId, setSelectedHighlightId] = useState<string | null>(null);
  const [selectedUnderlineId, setSelectedUnderlineId] = useState<string | null>(null);
  const [currentSelection, setCurrentSelection] = useState<Note | null>(null);
  
  const [notes, setNotes] = useState<Note[]>([]);
  const [highlights, setHighlights] = useState<HighlightItem[]>([]);

  const notesRef = useRef(notes);
  const highlightsRef = useRef(highlights);
  useEffect(() => { notesRef.current = notes; }, [notes]);
  useEffect(() => { highlightsRef.current = highlights; }, [highlights]);

  // --- TRAVERSAL HELPERS ---
  const traverseNodes = useCallback((node: Node, callback?: (n: Node) => void) => {
    if (node.hasChildNodes()) {
      node.childNodes.forEach((child) => traverseNodes(child, callback));
    } else {
      callback?.(node);
    }
  }, []);

  const createSpan = useCallback((nodeId: string, type: "highlight" | "underline", onClick: (event: MouseEvent) => void, bgColor?: string) => {
    const span = document.createElement("span");
    span.className = type === "highlight" ? HIGHLIGHT_CLASS : UNDERLINE_CLASS;
    if (type === "highlight") {
      span.style.backgroundColor = bgColor || HIGHLIGHT_COLOR;
      span.style.textDecoration = "none";
      span.style.borderRadius = "0";
      span.style.padding = "1px 0";
      span.style.color = "#fff";
    } else {
      // Note: blue background
      span.style.backgroundColor = bgColor || "#BFDBFE";
      span.style.textDecoration = "none";
      span.style.borderRadius = "0";
      span.style.padding = "1px 0";
      span.style.color = "#fff";
      span.style.fontWeight = "600";
    }
    span.dataset.nodeId = nodeId;
    span.dataset.color = bgColor || (type === "highlight" ? HIGHLIGHT_COLOR : "#BFDBFE");
    span.onclick = onClick;
    return span;
  }, [HIGHLIGHT_CLASS, HIGHLIGHT_COLOR, UNDERLINE_CLASS, UNDERLINE_STYLE]);

  const processTextNode = useCallback((node: Node, range: Range, nodeId: string, type: "highlight" | "underline", bgColor?: string) => {
    if (node.nodeType !== Node.TEXT_NODE) return;
    const textNode = node as Text;
    const nodeText = textNode.textContent || "";

    const onClick = () => {
      const selection = document.getSelection();
      if (selection && selection.toString().trim()) return;
      if (type === "highlight") {
        setSelectedHighlightId(nodeId);
        setSelectedUnderlineId(null);
      } else {
        // Notes are managed via sidebar — open sidebar when clicking note span
        setSelectedUnderlineId(nodeId);
        setSelectedHighlightId(null);
        const currentNote = notesRef.current.find((n) => n.nodeId === nodeId);
        setCurrentSelection(currentNote || null);
        setIsNotesViewOpen(true);
      }
    };

    const span = createSpan(nodeId, type, onClick, bgColor);

    if (textNode.parentElement?.classList.contains(type === "highlight" ? HIGHLIGHT_CLASS : UNDERLINE_CLASS)) {
      textNode.parentElement.parentElement?.replaceChild(textNode, textNode.parentElement);
    }

    if (textNode === range.startContainer) {
      const startOffset = range.startOffset;
      const isSameContainer = textNode === range.endContainer;
      const textContent = isSameContainer ? nodeText.substring(startOffset, range.endOffset) : nodeText.substring(startOffset);
      const endText = isSameContainer ? nodeText.substring(range.endOffset) : "";

      if (textContent) {
        span.textContent = textContent;
        const splitNode = textNode.splitText(startOffset);
        splitNode.parentElement?.insertBefore(span, splitNode);
        if (endText) splitNode.nodeValue = endText;
        else splitNode.parentElement?.removeChild(splitNode);
      }
    } else if (textNode === range.endContainer) {
      const endOffset = range.endOffset;
      span.textContent = nodeText.substring(0, endOffset);
      const splitNode = textNode.splitText(0);
      splitNode.nodeValue = nodeText.substring(endOffset);
      splitNode.parentElement?.insertBefore(span, splitNode);
    } else {
      span.textContent = nodeText;
      textNode.parentElement?.insertBefore(span, textNode);
      textNode.parentElement?.removeChild(textNode);
    }

    // Only show tooltip popup for highlights, not for notes (notes use sidebar)
    if (type === "highlight") {
      const { x, y, width, height } = span.getBoundingClientRect();
      span.addEventListener("click", () => {
        setTooltip({
          position: { x: x + width / 2, y: y + height + 2 },
          visible: true,
        });
      });
    }
  }, [HIGHLIGHT_CLASS, UNDERLINE_CLASS, createSpan]);

  // --- CORE LOGIC: APPLY ---
  const applySelection = useCallback((type: "highlight" | "underline", existingId?: string, forceRange?: Range, bgColor?: string) => {
    let range: Range;
    let selection: Selection | null = null;

    if (forceRange) {
        range = forceRange;
    } else {
        selection = document.getSelection();
        if (!selection?.rangeCount) return null;
        range = selection.getRangeAt(0);
    }

    const wrapper = document.querySelectorAll(`.${SANDBOX_ID}`);
    const selectedText = range.toString().trim();
    const isWithinWrapper = Array.from(wrapper).some((el) => el.contains(range.startContainer) && el.contains(range.endContainer));

    if (!selectedText || !isWithinWrapper) return null;

    const nodeId = existingId || uniqueId(type === "highlight" ? "highlighted_" : "underlined_");
    const ancestor = range.commonAncestorContainer;

    if (ancestor.hasChildNodes()) {
      const children = Array.from(ancestor.childNodes);
      let startIdx = 0;
      let endIdx = children.length - 1;
      children.forEach((node, idx) => {
        if (node === range.startContainer || node.contains?.(range.startContainer)) startIdx = idx;
        if (node === range.endContainer || node.contains?.(range.endContainer)) endIdx = idx;
      });
      for (let i = startIdx; i <= endIdx; i++) {
        traverseNodes(children[i], (childNode) => processTextNode(childNode, range, nodeId, type, bgColor));
      }
    } else {
      processTextNode(ancestor, range, nodeId, type, bgColor);
    }

    if (selection) selection.removeAllRanges();

    return { nodeId, text: selectedText };
  }, [SANDBOX_ID, processTextNode, traverseNodes]);

  // --- HANDLERS ---
  const HIGHLIGHT_BROWN = "#92400E";
  const HIGHLIGHT_PINK  = "#EC4899";
  const NOTE_BLUE       = "#48a7f6";

  const handleHighlight = useCallback(() => {
    // Detect if selection overlaps with existing annotation → pink, else brown
    let bgColor = HIGHLIGHT_BROWN;
    const selection = document.getSelection();
    if (selection?.rangeCount) {
      const range = selection.getRangeAt(0);
      const existingSpans = document.querySelectorAll("[data-node-id]");
      const hasOverlap = Array.from(existingSpans).some((span) => range.intersectsNode(span));
      if (hasOverlap) bgColor = HIGHLIGHT_PINK;
    }

    const res = applySelection("highlight", undefined, undefined, bgColor);
    if (res) {
      setHighlights(prev => [...prev, { ...res, type: "highlight", color: bgColor }]);
      setTooltip((prev) => ({ ...prev, visible: false }));
    }
  }, [applySelection]);

  const handleNote = useCallback(() => {
    const res = applySelection("underline", undefined, undefined, NOTE_BLUE);
    if (res) {
        setHighlights(prev => [...prev, { ...res, type: "underline", color: NOTE_BLUE }]);
        // Hide tooltip immediately - sidebar will open instead
        setTooltip(prev => ({ ...prev, visible: false }));
        return { nodeId: res.nodeId, text: res.text, nodeContent: "" };
    }
    return null;
  }, [applySelection]);

  // --- REMOVAL LOGIC (ĐƯỢC TỐI ƯU HÓA) ---
  const removeFn = useCallback((node: Element) => {
    const parent = node.parentElement;
    if (parent) {
      const childNodes = Array.from(node.childNodes);
      const fragment = document.createDocumentFragment();
      childNodes.forEach((child) => fragment.appendChild(child));
      
      // Sử dụng try/catch và contains() để tránh lỗi khi node đã bị gỡ
      if (parent.contains(node)) {
        try {
          parent.replaceChild(fragment, node);
          parent.normalize();
        } catch (e) {
          console.warn("Error during removeFn replaceChild:", e);
        }
      }
    }
  }, []);

  const removeHighlight = useCallback(() => {
    if (!selectedHighlightId) return;
    document.querySelectorAll(`[data-node-id="${selectedHighlightId}"]`).forEach(removeFn);
    setHighlights(prev => prev.filter(h => h.nodeId !== selectedHighlightId));
    setSelectedHighlightId(null);
    setTooltip((prev) => ({ ...prev, visible: false }));
  }, [removeFn, selectedHighlightId]);

  const removeUnderline = useCallback((nodeId?: string) => {
    const selectedId = nodeId || selectedUnderlineId;
    if (!selectedId) return;
    document.querySelectorAll(`[data-node-id="${selectedId}"]`).forEach(removeFn);
    setNotes((prev) => prev.filter((note) => note.nodeId !== selectedId));
    setHighlights(prev => prev.filter(h => h.nodeId !== selectedId));
    setSelectedUnderlineId(null);
    setCurrentSelection(null);
    setTooltip((prev) => ({ ...prev, visible: false }));
  }, [removeFn, selectedUnderlineId]);

  // --- NOTE SUBMIT ---
  const handleNoteSubmit = useCallback((value: string, isEdit: Note | false = false) => {
    const trimmedValue = value.trim();
    // Allow saving empty notes - only delete via explicit DELETE button
    if (isEdit && isEdit.nodeContent === trimmedValue) {
      setCurrentSelection(null);
      setTooltip((prev) => ({ ...prev, visible: false }));
      return;
    }
    if (isEdit) {
      setNotes((prev) => prev.map((note) => note.nodeId === isEdit.nodeId ? { ...note, nodeContent: trimmedValue } : note));
    } else {
      if (!currentSelection) return;
      setNotes((prev) => [...prev, { nodeId: currentSelection.nodeId, text: currentSelection.text, nodeContent: trimmedValue }]);
    }
    setCurrentSelection(null);
    setTooltip((prev) => ({ ...prev, visible: false }));
  }, [currentSelection, removeUnderline]);

  // --- RESTORE & CLEANUP LOGIC (FIX LỖI CÂY DOM) ---
  const revertDOM = useCallback(() => {
    const sandboxes = document.querySelectorAll(`.${SANDBOX_ID}`);
    if (!sandboxes.length) return;
    
    sandboxes.forEach(sandbox => {
        // 1. Hoàn nguyên SPAN về Text Node gốc
        const spans = sandbox.querySelectorAll(`span[data-node-id^="highlighted_"], span[data-node-id^="underlined_"]`);
        
        spans.forEach(span => {
            const parent = span.parentNode;
            
            if (parent) {
                 const childNodes = Array.from(span.childNodes);
                 const fragment = document.createDocumentFragment();
                 childNodes.forEach((child) => fragment.appendChild(child));
                
                 // Chỉ thay thế nếu span vẫn còn trong cây DOM
                 if (parent.contains(span)) {
                    try {
                        parent.replaceChild(fragment, span);
                        // Dùng normalize để hợp nhất Text Node sau khi replace
                        parent.normalize(); 
                    } catch (e) {
                        // Bỏ qua lỗi DOM không tìm thấy node
                        console.warn("Revert DOM failed for span", e);
                    }
                 }
            }
        });

        // 2. Hợp nhất Text Node trên toàn bộ sandbox sau khi hoàn nguyên
        sandbox.normalize();
    });
  }, [SANDBOX_ID]);

  const restoreHighlights = useCallback((itemsToRestore: HighlightItem[]) => {
    if (!itemsToRestore.length) return;
    const sandboxes = document.querySelectorAll(`.${SANDBOX_ID}`);
    if (!sandboxes.length) return;

    const sel = window.getSelection();
    sel?.removeAllRanges();

    itemsToRestore.forEach(item => {
        let restored = false;
        // Duyệt qua tất cả các sandbox cho đến khi tìm thấy và restore được text
        for (const sandbox of Array.from(sandboxes)) {
            const walker = document.createTreeWalker(sandbox, NodeFilter.SHOW_TEXT, null);
            let currentNode = walker.nextNode();
            
            while (currentNode) {
                const nodeVal = currentNode.nodeValue || "";
                const idx = nodeVal.indexOf(item.text);
                
                if (idx !== -1) {
                    const range = document.createRange();
                    range.setStart(currentNode, idx);
                    range.setEnd(currentNode, idx + item.text.length);
                    applySelection(item.type, item.nodeId, range, item.color);
                    restored = true;
                    break;
                }
                currentNode = walker.nextNode();
            }
            if (restored) break;
        }
    });
    sel?.removeAllRanges();
  }, [SANDBOX_ID, applySelection]);

  useEffect(() => {
    const currentPartIndex = part.current;

    // LOAD
    if (savedPassageData[currentPartIndex]) {
        const data = savedPassageData[currentPartIndex];
        setNotes(data.notes || []);
        setHighlights(data.highlights || []);
        
        // Timeout ngắn để đảm bảo React đã render DOM Passage từ HTML gốc
        setTimeout(() => {
            if (data.highlights && data.highlights.length > 0) {
                restoreHighlights(data.highlights);
            }
        }, 50); 
    } else {
        setNotes([]);
        setHighlights([]);
    }

    // SAVE & CLEANUP: Chạy khi Component UNMOUNT (do có key ở component cha)
    return () => {
        setSavedPassageData(prev => ({
            ...prev,
            [currentPartIndex]: {
                notes: notesRef.current,
                highlights: highlightsRef.current
            }
        }));
        
        // Gọi revertDOM để dọn dẹp highlight và chuẩn hóa DOM Passage
        revertDOM(); 
    };
  // 🔥 FIX: Thêm setSavedPassageData vào Dependency để tránh hàm bị stale
  }, [part.current, revertDOM, restoreHighlights, setSavedPassageData]); 


  // --- SELECTION EVENT HANDLER ---
  const handleSelectionChange = useCallback(() => {
    const selection = document.getSelection();
    if (!selection?.rangeCount) return;
    const range = selection.getRangeAt(0);
    const wrapper = document.querySelectorAll(`.${SANDBOX_ID}`);
    const selectedText = selection.toString().trim();
    const isWithinWrapper = Array.from(wrapper).some((el) => el.contains(range.startContainer) && el.contains(range.endContainer));

    if (!selectedText || !isWithinWrapper) return;

    // When user selects new text, always show Note/Highlight options
    // (even if selection overlaps existing spans — that triggers pink highlight).
    // Remove option is only shown via the span's own onClick handler.
    setSelectedHighlightId(null);
    setSelectedUnderlineId(null);
    setCurrentSelection(null);

    const { x, y, width, height } = range.getBoundingClientRect();
    setTooltip({ position: { x: x + width / 2, y: y + height + 2 }, visible: true });

  }, [SANDBOX_ID]);

  useEffect(() => {
    const hideTooltip = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const isTooltip = tooltipRef.current?.contains(target);
      const isEdit = notesRef.current.find((n) => n.nodeId === currentSelection?.nodeId);
      
      if (!isTooltip) {
        setTooltip((prev) => ({ ...prev, visible: false }));
        if (currentSelection && !isEdit) removeUnderline(currentSelection.nodeId);
        setCurrentSelection(null);
      }
    };
    document.addEventListener("selectionchange", handleSelectionChange, true);
    document.addEventListener("mousedown", hideTooltip, true);
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange, true);
      document.removeEventListener("mousedown", hideTooltip, true);
    };
  }, [currentSelection, handleSelectionChange, removeUnderline]);

  return (
    <TextSelectionContext.Provider
      value={{
        options,
        tooltip,
        selectedHighlightId,
        selectedUnderlineId,
        currentSelection,
        setCurrentSelection,
        notes,
        handleHighlight,
        handleNote: () => {
          const result = handleNote();
          if (result) {
            setCurrentSelection(result);
            // Add note to notes immediately with empty content
            setNotes(prev => [...prev, { nodeId: result.nodeId, text: result.text, nodeContent: "" }]);
            // Open sidebar instead of showing popup
            setIsNotesViewOpen(true);
          }
        },
        removeHighlight,
        removeUnderline,
        handleNoteSubmit,
        tooltipRef,
      }}
    >
      {children}
      <TooltipPopup />
    </TextSelectionContext.Provider>
  );
};

export const TextSelectionWrapper = ({ children }: { children: React.ReactNode }) => {
  const context = useTextSelectionContext();
  if (!context) return <>{children}</>;
  return <div className={context.options.ID}>{children}</div>;
};

const NoteFormInput = ({ initialValue, isEdit = false }: { initialValue?: string; isEdit?: Note | false }) => {
  const { handleNoteSubmit, removeUnderline } = useTextSelectionContext()!;
  const [value, setValue] = useState(initialValue || "");
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => setValue(e.target.value);
  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleNoteSubmit(value, isEdit);
  };
  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isEdit) return;
    removeUnderline(isEdit.nodeId);
  };
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      e.stopPropagation();
      handleNoteSubmit(value, isEdit);
    }
  };
  return (
    <div className="flex flex-col">
      <Input.TextArea 
        value={value} 
        onChange={handleChange} 
        onKeyDown={handleKeyDown}
        placeholder={isEdit ? "Remove note..." : "Add note..."} 
        className="mb-2 min-w-[250px]" 
        rows={4} 
      />
      <div className="flex gap-2">
        <Button type="primary" htmlType="button" onClick={handleSave}>{isEdit ? "Save Changes" : "Save Changes"}</Button>
        {isEdit && <Button type="default" htmlType="button" onClick={handleDelete} className="flex items-center"><NoteClearIcon className="text-lg" />Remove Note</Button>}
      </div>
    </div>
  );
};

const TooltipPopup = () => {
  const { tooltip, tooltipRef, selectedHighlightId, selectedUnderlineId, currentSelection, handleHighlight, handleNote, removeHighlight, notes } = useTextSelectionContext()!;

  const isDefault = !currentSelection && !selectedHighlightId && !selectedUnderlineId;
  const showArrow = isDefault || !!selectedHighlightId;

  return (
    <div
      ref={tooltipRef}
      style={{
        left: tooltip.position.x,
        top: tooltip.position.y,
        opacity: tooltip.visible ? 1 : 0,
        visibility: tooltip.visible ? "visible" : "hidden",
        transform: "translateX(-50%) translateY(8px)",
        pointerEvents: tooltip.visible ? "auto" : "none",
      }}
      className="absolute z-50 bg-white border border-gray-400"
    >
      {/* Arrow pointing up */}
      {showArrow && (
        <>
          {/* Outer arrow (border) */}
          <div
            style={{
              position: "absolute",
              top: -9,
              left: "50%",
              transform: "translateX(-50%)",
              width: 0,
              height: 0,
              borderLeft: "10px solid transparent",
              borderRight: "10px solid transparent",
              borderBottom: "10px solid #99a1af",
            }}
          />
          {/* Inner arrow (white fill) */}
          <div
            style={{
              position: "absolute",
              top: -8,
              left: "50%",
              transform: "translateX(-50%)",
              width: 0,
              height: 0,
              borderLeft: "9px solid transparent",
              borderRight: "9px solid transparent",
              borderBottom: "9px solid white",
            }}
          />
        </>
      )}

      {/* Main content */}
      <div className="px-3 py-2.5 pt-1 pl-1.5">
        {/* Default: Note + Highlight with icon backgrounds */}
        {isDefault && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleNote}
              className="flex flex-col items-center cursor-pointer group"
            >
              <div className="w-[44px] h-[36px] bg-[#e5e7eb] rounded-lg flex items-center justify-center bg-transparent">
                <NoteIcon className="text-[24px] text-[#374151]" />
              </div>
              <span className="text-[12px] font-medium text-[#4B5563] whitespace-nowrap">Note</span>
            </button>
            <button
              type="button"
              onClick={handleHighlight}
              className="flex flex-col items-center cursor-pointer group"
            >
              <div className="w-[44px] h-[36px] bg-[#e5e7eb] rounded-lg flex items-center justify-center bg-transparent">
                <MarkerIcon className="text-[24px] text-[#374151]" />
              </div>
              <span className="text-[12px] font-medium text-[#4B5563] whitespace-nowrap">Highlight</span>
            </button>
          </div>
        )}

        {/* Remove highlight */}
        {!currentSelection && selectedHighlightId && (
          <button
            type="button"
            onClick={removeHighlight}
            className="flex flex-col items-center cursor-pointer group pl-2"
          >
            <div className="w-[44px] h-[36px] bg-[#e5e7eb] rounded-lg flex items-center justify-center bg-transparent">
              <MarkerClearIcon className="text-[24px] text-[#374151]" />
            </div>
            <span className="text-[12px] font-medium text-[#4B5563] whitespace-nowrap">Remove</span>
          </button>
        )}
      </div>
    </div>
  );
};