import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { createClient } from "~supabase/client";
import { useAuth } from "@/appx/providers";

type TargetScore = {
  examDate: string | null;
  listening: number | null;
  reading: number | null;
  speaking: number | null;
  writing: number | null;
};

const defaultValue: TargetScore = {
  examDate: null,
  listening: null,
  reading: null,
  speaking: null,
  writing: null,
};

const WidgetContext = createContext<{
  targetScore: TargetScore;
  refetch: () => Promise<any>;
  loading: boolean;
}>({
  targetScore: defaultValue,
  refetch: () => Promise.resolve({}),
  loading: false,
});

export const useWidgetContext = () => {
  return useContext(WidgetContext);
};

export const WidgetContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { currentUser } = useAuth();
  const [targetScore, setTargetScore] = useState<TargetScore>(defaultValue);
  const [loading, setLoading] = useState(true);

  const fetchTargetScore = useCallback(async () => {
    if (!currentUser?.id) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const supabase = createClient();
      const { data, error } = await supabase
        .from("users")
        .select("target_score")
        .eq("id", currentUser.id)
        .single();

      if (error) {
        console.error("Error fetching target score from DB:", error);
        return;
      }

      if (data) {
        let ts = data.target_score as any;
        if (typeof ts === "string") {
          try {
            ts = JSON.parse(ts);
          } catch (e) {
            ts = {};
          }
        }
        ts = ts || {};

        setTargetScore({
          examDate: ts.exam_date || null,
          listening: ts.listening != null ? Number(ts.listening) : null,
          reading: ts.reading != null ? Number(ts.reading) : null,
          speaking: ts.speaking != null ? Number(ts.speaking) : null,
          writing: ts.writing != null ? Number(ts.writing) : null,
        });
      }
    } catch (error) {
      console.error("Error fetching target score:", error);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    fetchTargetScore();
  }, [fetchTargetScore]);

  return (
    <WidgetContext.Provider
      value={{
        targetScore,
        refetch: fetchTargetScore,
        loading,
      }}
    >
      {children}
    </WidgetContext.Provider>
  );
};
