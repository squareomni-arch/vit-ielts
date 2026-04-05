import { Button, Divider } from "antd";
import Link from "next/link";
import { IPracticeSingle } from "../../api";
import { ROUTES } from "@/shared/routes";
import { toast } from "react-toastify";
import { Facebook } from "@/shared/ui/icons";
import { useProContentModal } from "@/shared/ui/pro-content";
import { useAuth } from "@/appx/providers";
import { LinkButton } from "@/shared/ui";

function LeftInteractionSidebar({ post }: { post: IPracticeSingle }) {
  const openProContentModal = useProContentModal((state) => state.open);
  const { currentUser } = useAuth();

  const Content = () => (
    <div className="space-y-2">
      <Link
        href={
          post.quizFields.skill[0] === "listening"
            ? ROUTES.PRACTICE.ARCHIVE_LISTENING
            : ROUTES.PRACTICE.ARCHIVE_READING
        }
        title={post.title}
        className="hover:text-primary duration-75 font-semibold text-base block"
      >
        IELTS{" "}
        {post.quizFields.skill[0] === "listening" ? "Listening" : "Reading"}{" "}
        Practice
      </Link>
      <p className="text-gray-500">
        Includes taking questions, viewing detailed explanations, and learning
        the vocabulary of the most popular IELTS Reading tests on the market
      </p>
      <Divider />
      <div>
        <Button
          type="link"
          className="px-0 text-default hover:text-primary"
          onClick={() =>
            navigator.clipboard
              .writeText(post.link)
              .then(() => toast.success("Copied to clipboard!"))
          }
        >
          <span className="material-symbols-rounded text-base!">
            content_copy
          </span>
          <span className="leading-none">Copy link</span>
        </Button>
      </div>
      <div>
        <Button
          type="link"
          className="px-0 text-default hover:text-primary"
          href={`https://www.facebook.com/sharer/sharer.php?u=${post.link}`}
          target="_blank"
        >
          <Facebook />
          <span className="leading-none">Share</span>
        </Button>
      </div>
      {!currentUser ? (
        <Link
          href={ROUTES.LOGIN(ROUTES.TAKE_THE_TEST(post.slug))}
          passHref
          title={post.title}
          legacyBehavior
        >
          <LinkButton target="_blank" type="primary" size="large">
            <span className="material-symbols-rounded">play_circle</span>
            <span>Start Practice</span>
          </LinkButton>
        </Link>
      ) : post.quizFields.proUserOnly && currentUser.userData.isPro ? (
        <Link
          href={ROUTES.TAKE_THE_TEST(post.slug)}
          passHref
          title={post.title}
          legacyBehavior
        >
          <LinkButton target="_blank" type="primary" size="large">
            <span className="material-symbols-rounded">play_circle</span>
            <span>Start Practice</span>
          </LinkButton>
        </Link>
      ) : post.quizFields.proUserOnly ? (
        <Button type="primary" size="large" onClick={openProContentModal}>
          <span className="material-symbols-rounded">play_circle</span>
          <span>Start Practice</span>
        </Button>
      ) : (
        <Link
          href={ROUTES.TAKE_THE_TEST(post.slug)}
          passHref
          title={post.title}
          legacyBehavior
        >
          <LinkButton target="_blank" type="primary" size="large">
            <span className="material-symbols-rounded">play_circle</span>
            <span>Start Practice</span>
          </LinkButton>
        </Link>
      )}
    </div>
  );

  return (
    <>
      <div className="sticky top-8 pb-4">
        <Content />
      </div>
      {/* <div className="md:hidden p-4 rounded border border-gray-200">
        <Content />
      </div> */}
    </>
  );
}

export default LeftInteractionSidebar;
