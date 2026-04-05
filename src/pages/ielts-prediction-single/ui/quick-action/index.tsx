import { ROUTES } from "@/shared/routes";
import { LinkButton } from "@/shared/ui";
import Link from "next/link";
import { IPracticeSingle } from "../../api";
import { useAuth } from "@/appx/providers";
import { Button } from "antd";
import { useProContentModal } from "@/shared/ui/pro-content";

function QuickAction({ post }: { post: IPracticeSingle }) {
  const { currentUser } = useAuth();
  const openProContentModal = useProContentModal((state) => state.open);

  return (
    <div className="py-2 border-t border-b border-gray-200">
      <div className="flex items-center gap-2">
        {!currentUser ? (
          <Link
            href={ROUTES.LOGIN(ROUTES.TAKE_THE_TEST(post.slug))}
            passHref
            title={post.title}
            legacyBehavior
          >
            <LinkButton type="link" className="group">
              <span className="material-symbols-rounded text-primary!">
                play_circle
              </span>
              <span className="text-default group-hover:underline">
                Start Practice
              </span>
            </LinkButton>
          </Link>
        ) : post.quizFields.proUserOnly ? (
          currentUser.userData.isPro ? (
            <Link
              href={ROUTES.TAKE_THE_TEST(post.slug)}
              passHref
              title={post.title}
              legacyBehavior
            >
              <LinkButton type="link" className="group">
                <span className="material-symbols-rounded text-primary!">
                  play_circle
                </span>
                <span className="text-default group-hover:underline">
                  Start Practice
                </span>
              </LinkButton>
            </Link>
          ) : (
            <Button type="link" className="group" onClick={openProContentModal}>
              <span className="material-symbols-rounded text-primary!">
                play_circle
              </span>
              <span className="text-default group-hover:underline">
                Start Practice
              </span>
            </Button>
          )
        ) : (
          <Link
            href={ROUTES.TAKE_THE_TEST(post.slug)}
            passHref
            title={post.title}
            legacyBehavior
          >
            <LinkButton type="link" className="group">
              <span className="material-symbols-rounded text-primary!">
                play_circle
              </span>
              <span className="text-default group-hover:underline">
                Start Practice
              </span>
            </LinkButton>
          </Link>
        )}

        <Link href={"#download-pdf"} passHref title={post.title} legacyBehavior>
          <LinkButton type="link" className="group">
            <span className="material-symbols-rounded text-green-600!">
              widgets
            </span>
            <span className="text-default group-hover:underline">
              View Solutions
            </span>
          </LinkButton>
        </Link>
      </div>
    </div>
  );
}

export default QuickAction;
