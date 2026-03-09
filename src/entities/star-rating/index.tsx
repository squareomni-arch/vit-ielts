import { useAuth } from "@/appx/providers";
import { ROUTES } from "@/shared/routes";
import { IPost } from "@/shared/types";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { twMerge } from "tailwind-merge";
import { createClient } from "~supabase/client";
import { ratePost } from "~services/post";

export const StarRating = ({ post }: { post: IPost }) => {
  const [ratingData, setRatingData] = useState(post.rating);
  const router = useRouter();
  const { currentUser } = useAuth();
  const [percent, setPercent] = useState(0);

  useEffect(() => {
    setPercent((ratingData.rate / 5) * 100);
  }, [ratingData]);

  const handleRate = async (rate: number) => {
    if (ratingData.voted) return;
    if (currentUser) {
      try {
        const supabase = createClient();
        const result = await ratePost(supabase, post.id, currentUser.id, rate);
        if (result) {
          setRatingData({ rate: result.rate, count: result.count, voted: true });
        }
      } catch (err) {
        console.error("Rating failed:", err);
      }
    } else {
      router.push(`${ROUTES.LOGIN}?redirect=${router.asPath}`);
    }
  };

  return (
    <div className="flex items-end text-xs space-x-1" title={`${percent}%`}>
      <p className="text-tertiary-500 font-medium">
        {ratingData.rate.toFixed(1)}
      </p>
      <div className="flex relative text-tertiary-500">
        {Array.from({ length: 5 }).map((_, index) => (
          <button
            onClick={() => handleRate(index + 1)}
            key={index}
            className={twMerge(index < 4 && "-mr-1.5")}
          >
            <span
              onMouseEnter={() =>
                !ratingData.voted && setPercent((index + 1) * 20)
              }
              onMouseLeave={() =>
                !ratingData.voted && setPercent(ratingData.rate * 20)
              }
              className={twMerge(
                "material-symbols-rounded text-lg! leading-none! block!",
                !ratingData.voted && "cursor-pointer"
              )}
            >
              star
            </span>
          </button>
        ))}
        <div
          className="flex absolute overflow-hidden pointer-events-none"
          style={{ width: `${percent}%` }}
        >
          {Array.from({ length: 5 }).map((_, index) => (
            <span
              key={index}
              className={twMerge(
                "material-symbols-rounded text-lg! leading-none! filled",
                index < 4 && "-mr-1.5"
              )}
            >
              star
            </span>
          ))}
        </div>
      </div>
      <p className="italic text-neutral-700">({ratingData.count} votes)</p>
    </div>
  );
};
