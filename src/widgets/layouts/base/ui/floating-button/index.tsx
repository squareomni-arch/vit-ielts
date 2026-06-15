import { useAppContext } from "@/appx/providers";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";

export const FloatingButton = () => {
  const router = useRouter();
  const {
    masterData: {
      websiteOptions: {
        websiteOptionsFields: {
          generalSettings: { facebook, zalo },
        },
      },
    },
  } = useAppContext();

  if (router.pathname === "/subscription") {
    return null;
  }

  return (
    <div className="fixed z-50 right-3 sm:right-9 bottom-6 sm:bottom-10 flex flex-col items-center gap-3">
      {/* Facebook */}
      <Link
        href={facebook}
        className="w-12 h-12 relative block"
        target="_blank"
        rel="nofollow noopener noreferrer"
        aria-label="Facebook"
      >
        <Image
          fill
          alt="Facebook"
          src="/facebook-floating.webp"
          className="object-contain"
          unoptimized
        />
      </Link>

      {/* Zalo */}
      <Link
        href={zalo}
        className="w-12 h-12 relative block"
        target="_blank"
        rel="nofollow noopener noreferrer"
        aria-label="Zalo"
      >
        <Image
          fill
          alt="Zalo"
          src="/zalo-floating.png"
          sizes="48px"
          className="object-contain"
          unoptimized
        />
      </Link>
    </div>
  );
};
